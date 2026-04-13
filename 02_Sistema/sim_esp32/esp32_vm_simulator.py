#!/usr/bin/env python3
import json
import os
import signal
import sys
import time
from pathlib import Path

import paho.mqtt.client as mqtt
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parent
ENV_PATH = ROOT / ".env"


def load_env():
    file_values = dotenv_values(str(ENV_PATH)) if ENV_PATH.exists() else {}
    return {**file_values, **os.environ}


class Simulator:
    def __init__(self, env):
        self.env = env
        self.running = True

        self.node_id = env.get("SIM_NODE_ID", "vm_sim_esp32_01")
        self.device = env.get("SIM_MACHINE_DEVICE", "lavadora1")
        self.telemetry_interval = int(env.get("TELEMETRY_INTERVAL_SEC", "20"))

        self.topic_machine_cmd = f"kwl/maquinas/{self.device}/comando"
        self.topic_machine_status = f"kwl/maquinas/{self.device}/estado"
        self.topic_machine_event = f"kwl/maquinas/{self.device}/evento"
        self.topic_machine_telemetry = f"kwl/maquinas/{self.device}/telemetria"
        self.topic_machine_availability = f"kwl/maquinas/{self.device}/disponibilidad"

        self.topic_door_cmd = "kwl/sistema/puerta/comando"
        self.topic_door_status = "kwl/sistema/puerta/estado"
        self.topic_light_cmd = "kwl/sistema/luces/comando"
        self.topic_light_status = "kwl/sistema/luces/estado"

        self.machine_state = "STOP"
        self.door_state = "CERRADA"
        self.light_state = "OFF"

        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=self.node_id)
        self.client.username_pw_set(env.get("MQTT_USER", "kwl"), env.get("MQTT_PASS", ""))
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

    def publish_json(self, topic, payload, retain=False):
        self.client.publish(topic, json.dumps(payload, ensure_ascii=True), qos=1, retain=retain)

    def publish_text(self, topic, payload, retain=False):
        self.client.publish(topic, payload, qos=1, retain=retain)

    def on_connect(self, client, userdata, flags, reason_code, properties):
        print(f"[sim] mqtt connected: {reason_code}")
        client.subscribe(self.topic_machine_cmd, qos=1)
        client.subscribe(self.topic_door_cmd, qos=1)
        client.subscribe(self.topic_light_cmd, qos=1)

        self.publish_text(self.topic_machine_availability, "online", retain=True)
        self.publish_machine_state()
        self.publish_door_state()
        self.publish_light_state()
        self.publish_event("sim_connected", "vm simulator online")

    def publish_machine_state(self):
        self.publish_json(self.topic_machine_status, {"estado": self.machine_state, "nodo": self.node_id}, retain=True)

    def publish_door_state(self):
        self.publish_json(self.topic_door_status, {"estado": self.door_state}, retain=True)

    def publish_light_state(self):
        self.publish_json(self.topic_light_status, {"estado": self.light_state}, retain=True)

    def publish_event(self, event_name, detail):
        self.publish_json(self.topic_machine_event, {"evento": event_name, "detalle": detail, "nodo": self.node_id})

    def publish_telemetry(self):
        self.publish_json(
            self.topic_machine_telemetry,
            {
                "rssidb": -40,
                "uptime_ms": int(time.time() * 1000),
                "heap": 180000,
                "sim": True,
            },
            retain=False,
        )

    @staticmethod
    def parse_action(raw):
        value = raw.strip()
        if value.startswith("{"):
            try:
                obj = json.loads(value)
                return str(obj.get("accion", "")).strip().lower()
            except json.JSONDecodeError:
                return value.lower()
        return value.lower()

    def on_message(self, client, userdata, msg):
        action = self.parse_action(msg.payload.decode("utf-8", errors="ignore"))
        topic = msg.topic

        if topic == self.topic_machine_cmd:
            self.handle_machine_action(action)
            return

        if topic == self.topic_door_cmd:
            self.handle_door_action(action)
            return

        if topic == self.topic_light_cmd:
            self.handle_light_action(action)
            return

    def handle_machine_action(self, action):
        if action in ("start", "encender"):
            self.machine_state = "EN_MARCHA"
            self.publish_machine_state()
            self.publish_event("machine_start", "sim start")
            return

        if action in ("stop", "apagar"):
            self.machine_state = "STOP"
            self.publish_machine_state()
            self.publish_event("machine_stop", "sim stop")
            return

        if action in ("restart", "reiniciar"):
            self.machine_state = "MANTENIMIENTO"
            self.publish_machine_state()
            time.sleep(1)
            self.machine_state = "STOP"
            self.publish_machine_state()
            self.publish_event("machine_restart", "sim restart pulse")
            return

        if action in ("status", "estado", "ping"):
            self.publish_machine_state()
            self.publish_door_state()
            self.publish_light_state()
            self.publish_telemetry()
            return

        self.publish_event("command_rejected", action)

    def handle_door_action(self, action):
        if action in ("abrir", "open"):
            self.door_state = "ABIERTA"
            self.publish_door_state()
            self.publish_event("door_open", "sim door open")
            return

        if action in ("cerrar", "close"):
            self.door_state = "CERRADA"
            self.publish_door_state()
            self.publish_event("door_close", "sim door close")
            return

        self.publish_event("door_command_rejected", action)

    def handle_light_action(self, action):
        if action in ("on", "luz", "light_on"):
            self.light_state = "ON"
            self.publish_light_state()
            self.publish_event("light_on", "sim light on")
            return

        if action in ("off", "sombra", "light_off"):
            self.light_state = "OFF"
            self.publish_light_state()
            self.publish_event("light_off", "sim light off")
            return

        self.publish_event("light_command_rejected", action)

    def run(self):
        self.client.will_set(self.topic_machine_availability, payload="offline", qos=1, retain=True)
        self.client.connect(self.env.get("MQTT_HOST", "127.0.0.1"), int(self.env.get("MQTT_PORT", "1883")), 30)
        self.client.loop_start()

        next_telemetry = time.time()
        while self.running:
            now = time.time()
            if now >= next_telemetry:
                self.publish_telemetry()
                next_telemetry = now + self.telemetry_interval
            time.sleep(0.2)

        self.publish_text(self.topic_machine_availability, "offline", retain=True)
        self.client.loop_stop()
        self.client.disconnect()


def main():
    env = load_env()
    sim = Simulator(env)

    def stop_handler(_sig, _frame):
        sim.running = False

    signal.signal(signal.SIGINT, stop_handler)
    signal.signal(signal.SIGTERM, stop_handler)

    sim.run()


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"[sim] fatal: {exc}", file=sys.stderr)
        sys.exit(1)
