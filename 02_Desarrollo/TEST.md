bash-5.3$ API_BASE=http://127.0.0.1:8080 LOGIN=admin@gmail.com PASSWORD=admin LAV_ID=3 /home/lsh/Documentos/GitHub/TFC/02_Desarrollo/deploy/demo/scripts/timer_drift_check.sh

API_BASE=http://127.0.0.1:8080 LOGIN=admin@gmail.com PASSWORD=admin LAV_ID=3 /home/lsh/Documentos/GitHub/TFC/02_Desarrollo/deploy/demo/scripts/machine_regression_check.sh
[timer-drift] ERROR: login falló
[regression] ERROR login
bash-5.3$ API_BASE=http://127.0.0.1:8080 LOGIN=admin@gmail.com PASSWORD=admin LAV_ID=3 /home/lsh/Documentos/GitHub/TFC/02_Desarrollo/deploy/demo/scripts/timer_drift_check.sh

^Z
[1]+  Detenido                   API_BASE=http://127.0.0.1:8080 LOGIN=admin@gmail.com PASSWORD=admin LAV_ID=3 /home/lsh/Documentos/GitHub/TFC/02_Desarrollo/deploy/demo/scripts/timer_drift_check.sh
bash-5.3$ API_BASE=http://127.0.0.1:8080 LOGIN=admin@gmail.com PASSWORD=admin LAV_ID=3 /home/lsh/Documentos/GitHub/TFC/02_Desarrollo/deploy/demo/scripts/machine_regression_check.sh
[regression] estado inicial=PAUSADA
[regression] transición STOP->iniciar=PAUSADA, tras crédito+iniciar=PAUSADA, detener=PAUSADA
[regression] FAIL
bash-5.3$ API_BASE=http://127.0.0.1:8080 LOGIN=admin@gmail.com PASSWORD=admin LAV_ID=3 /home/lsh/Documentos/GitHub/TFC/02_Desarrollo/deploy/demo/scripts/timer_drift_check.sh
[timer-drift] ERROR: no hay máquina EN_MARCHA para medir (tras esperar 30s)
bash-5.3$ ^C
bash-5.3$ 
