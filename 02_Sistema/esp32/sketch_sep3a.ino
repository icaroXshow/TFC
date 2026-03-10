#define RELAY_APAGAR     26
#define RELAY_REINICIAR  25
#define RELAY_PUERTA     33
#define RELAY_LUZ        32

String comando = "";

void setup() {
  Serial.begin(115200);
  Serial.println("🔌 Control de relés por comandos");
  Serial.println("Ej: on1, off1, Reiniciar, off2...");

  pinMode(RELAY_APAGAR, OUTPUT);
  pinMode(RELAY_REINICIAR, OUTPUT);
  pinMode(RELAY_PUERTA, OUTPUT);
  pinMode(RELAY_LUZ, OUTPUT);

  // Apaga todos los relés (HIGH = inactivo)
  digitalWrite(RELAY_APAGAR, LOW);
  digitalWrite(RELAY_REINICIAR, LOW);
  digitalWrite(RELAY_PUERTA, LOW);
  digitalWrite(RELAY_LUZ, LOW);
}

void loop() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      ejecutarComando(comando);
      comando = "";  // Limpia el comando después de ejecutarlo
    } else {
      comando += c;
    }
  }
}

void ejecutarComando(String cmd) {
  cmd.trim(); // elimina espacios y saltos

  if (cmd == "encender") {
    digitalWrite(RELAY_APAGAR, HIGH);
    Serial.println("✅ Relé 1 (Apagar) Maquina activada");
  } else if (cmd == "apagar") {
    digitalWrite(RELAY_APAGAR, LOW);
    Serial.println("⛔ Relé 1 (Apagar) Maquina desactivada");

  } else if (cmd == "reiniciar") {
    Serial.println("🔁 Relé 2 (Reiniciar) → pulso de 1 segundo");
    digitalWrite(RELAY_REINICIAR, LOW);   // Activa
    delay(2000);                          // Espera 1 segundo
    digitalWrite(RELAY_REINICIAR, HIGH);  // Desactiva
    Serial.println("✅ Pulso completado");

  } else if (cmd == "forzarapagado") {
    digitalWrite(RELAY_REINICIAR, LOW);
    Serial.println("⛔ Relé 2 (Reiniciar) forzado a apagado");

  } else if (cmd == "abrir") {
    digitalWrite(RELAY_PUERTA, LOW);
    Serial.println("✅ Relé 3 (Puerta) puerta abierta");
  } else if (cmd == "cerrar") {
    digitalWrite(RELAY_PUERTA, HIGH);
    Serial.println("⛔ Relé 3 (Puerta) desactivado");

  } else if (cmd == "luz") {
    digitalWrite(RELAY_LUZ, HIGH);
    Serial.println("✅ Relé 4 (Luz) Luz encendida");
  } else if (cmd == "sombra") {
    digitalWrite(RELAY_LUZ, LOW);
    Serial.println("⛔ Relé 4 (Luz) Luz apagada");

  } else {
    Serial.println("❓ Comando no reconocido: " + cmd);
  }
}



