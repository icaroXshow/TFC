#!/usr/bin/env python3
import json
import os
import re
import signal
import sys
import time
from pathlib import Path

import paho.mqtt.client as mqtt
import pymysql
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / ".env"


def load_env():
    file_values = dotenv_values(str(ENV_PATH)) if ENV_PATH.exists() else {}
    env = {**file_values, **os.environ}
    return env


def connect_db(env):
    return pymysql.connect(
        host=env.get("DB_HOST", "127.0.0.1"),
        port=int(env.get("DB_PORT", "3306")),
        user=env.get("DB_USER", "backend"),
        password=env.get("DB_PASS", ""),
        database=env.get("DB_NAME", "kwl_lavanderia"),
        charset="utf8mb4",
        autocommit=True,
    )


def infer_code_visible(device):
    device = device.lower()
    match_l = re.match(r"lavadora(\d+)", device)
    if match_l:
        return f"L{match_l.group(1)}"
    match_s = re.match(r"secadora(\d+)", device)
    if match_s:
        return f"S{match_s.group(1)}"
    return device.upper()


def upsert_global_config(connection, key, value):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id_configuracion
            FROM configuracion
            WHERE ambito = 'GLOBAL' AND id_lavanderia IS NULL AND clave = %s
            ORDER BY id_configuracion DESC
            LIMIT 1
            """,
            (key,),
        )
        found = cursor.fetchone()

        if found:
            cursor.execute(
                """
                UPDATE configuracion
                SET valor = %s, fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id_configuracion = %s
                """,
                (value, found[0]),
            )
            return

        cursor.execute(
            """
            INSERT INTO configuracion (ambito, id_lavanderia, clave, valor, descripcion)
            VALUES ('GLOBAL', NULL, %s, %s, 'Estado capturado desde MQTT bridge')
            """,
            (key, value),
        )


def log_machine_event(connection, machine_id, event_type, payload):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO log_maquina (id_lavanderia, id_maquina, fecha_hora, tipo_evento, nivel, payload, procesado)
            VALUES (1, %s, NOW(), %s, 'INFO', %s, 1)
            """,
            (machine_id, event_type[:50], json.dumps(payload, ensure_ascii=True)),
        )


def resolve_machine_id(connection, code_visible):
    with connection.cursor() as cursor:
        cursor.execute("SELECT id_maquina FROM maquina WHERE codigo_visible = %s LIMIT 1", (code_visible,))
        row = cursor.fetchone()
    return row[0] if row else None


def update_machine_state(connection, machine_id, state):
    with connection.cursor() as cursor:
        cursor.execute(
            "UPDATE maquina SET estado_actual = %s, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_maquina = %s",
            (state[:30], machine_id),
        )


class Bridge:
    def __init__(self, env):
        self.env = env
        self.running = True
        self.db = connect_db(env)

        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=env.get("MQTT_BRIDGE_CLIENT_ID", "kwl_mqtt_bridge"))
        self.client.username_pw_set(env.get("MQTT_USER", "kwl"), env.get("MQTT_PASS", ""))
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

    def on_connect(self, client, userdata, flags, reason_code, properties):
        print(f"[bridge] connected with code {reason_code}")
        client.subscribe("kwl/maquinas/+/estado", qos=1)
        client.subscribe("kwl/maquinas/+/evento", qos=1)
        client.subscribe("kwl/maquinas/+/disponibilidad", qos=1)
        client.subscribe("kwl/sistema/puerta/estado", qos=1)
        client.subscribe("kwl/sistema/luces/estado", qos=1)

    def on_message(self, client, userdata, msg):
        topic = msg.topic
        raw = msg.payload.decode("utf-8", errors="ignore").strip()
        payload = parse_payload(raw)

        parts = topic.split("/")
        if len(parts) < 4:
            return

        if parts[1] == "maquinas":
            device = parts[2]
            kind = parts[3]
            code_visible = infer_code_visible(device)
            machine_id = resolve_machine_id(self.db, code_visible)
            if machine_id is None:
                return

            if kind == "estado":
                state_value = payload.get("estado") if isinstance(payload, dict) else str(payload)
                update_machine_state(self.db, machine_id, str(state_value).upper())
                log_machine_event(self.db, machine_id, "MQTT_ESTADO", payload)
                return

            if kind == "evento":
                log_machine_event(self.db, machine_id, "MQTT_EVENTO", payload)
                return

            if kind == "disponibilidad":
                status_value = payload if isinstance(payload, str) else payload.get("estado", "unknown")
                log_machine_event(self.db, machine_id, "MQTT_DISP_" + str(status_value).upper(), payload)
                return

        if parts[1] == "sistema" and parts[2] == "puerta" and parts[3] == "estado":
            value = payload.get("estado") if isinstance(payload, dict) else str(payload)
            upsert_global_config(self.db, "SISTEMA_PUERTA_ESTADO", str(value).upper())
            return

        if parts[1] == "sistema" and parts[2] == "luces" and parts[3] == "estado":
            value = payload.get("estado") if isinstance(payload, dict) else str(payload)
            upsert_global_config(self.db, "SISTEMA_LUZ_ESTADO", str(value).upper())
            return

    def run(self):
        host = self.env.get("MQTT_HOST", "127.0.0.1")
        port = int(self.env.get("MQTT_PORT", "1883"))
        self.client.connect(host, port, 30)
        self.client.loop_start()

        while self.running:
            time.sleep(1)

        self.client.loop_stop()
        self.client.disconnect()
        self.db.close()


def parse_payload(raw):
    if raw == "":
        return ""
    if raw.startswith("{"):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return raw
    return raw


def main():
    env = load_env()
    bridge = Bridge(env)

    def stop_handler(_sig, _frame):
        bridge.running = False

    signal.signal(signal.SIGINT, stop_handler)
    signal.signal(signal.SIGTERM, stop_handler)

    bridge.run()


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"[bridge] fatal error: {exc}", file=sys.stderr)
        sys.exit(1)
