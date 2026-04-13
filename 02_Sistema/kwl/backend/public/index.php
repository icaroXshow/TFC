<?php
declare(strict_types=1);

session_name('KWLSESSID');
session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
    'cookie_secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
]);

header('Content-Type: application/json; charset=utf-8');

$env = loadEnv(__DIR__ . '/../.env');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

try {
    if ($uriPath === '/api/auth/login' && $method === 'POST') {
        $payload = parseJsonBody();
        $login = trim((string)($payload['login'] ?? ''));
        $password = (string)($payload['password'] ?? '');

        if ($login === '' || $password === '') {
            respond(422, ['error' => 'missing_credentials']);
        }

        $pdo = createPdo($env);
        $stmt = $pdo->prepare(
            'SELECT id_usuario, login, password_hash, rol, activo
             FROM usuario
             WHERE login = :login
             LIMIT 1'
        );
        $stmt->execute(['login' => $login]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || (int)$user['activo'] !== 1 || !verifyPassword((string)$user['password_hash'], $password)) {
            respond(401, ['error' => 'invalid_credentials']);
        }

        if (strtoupper((string)$user['rol']) !== 'ADMIN') {
            respond(403, ['error' => 'admin_only_access']);
        }

        session_regenerate_id(true);

        $_SESSION['user_id'] = (int)$user['id_usuario'];
        $_SESSION['user_login'] = (string)$user['login'];
        $_SESSION['user_role'] = strtoupper((string)$user['rol']);

        respond(200, [
            'authenticated' => true,
            'user' => [
                'id' => (int)$user['id_usuario'],
                'login' => (string)$user['login'],
                'role' => strtoupper((string)$user['rol']),
            ],
        ]);
    }

    if ($uriPath === '/api/auth/logout' && $method === 'POST') {
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 3600, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }

        session_destroy();
        respond(200, ['status' => 'logged_out']);
    }

    if ($uriPath === '/api/auth/me' && $method === 'GET') {
        if (!isAuthenticated()) {
            respond(200, ['authenticated' => false]);
        }

        respond(200, [
            'authenticated' => true,
            'user' => [
                'id' => (int)($_SESSION['user_id'] ?? 0),
                'login' => (string)($_SESSION['user_login'] ?? ''),
                'role' => (string)($_SESSION['user_role'] ?? ''),
            ],
        ]);
    }

    if ($uriPath === '/api/health' && $method === 'GET') {
        requireRole(['ADMIN']);

        $pdo = createPdo($env);
        $dbOk = (bool)$pdo->query('SELECT 1')->fetchColumn();
        $redisOk = checkRedis($env);
        $mqttOk = checkMqttConnectivity($env);

        respond(200, [
            'status' => 'ok',
            'service' => 'kwl-backend',
            'checks' => [
                'database' => $dbOk,
                'redis' => $redisOk,
                'mqtt' => $mqttOk,
            ],
            'time' => date(DATE_ATOM),
        ]);
    }

    if ($uriPath === '/api/machines' && $method === 'GET') {
        requireRole(['ADMIN']);

        $pdo = createPdo($env);
        $stmt = $pdo->query(
            'SELECT id_maquina, codigo_visible, tipo_maquina, estado_actual, activa FROM maquina ORDER BY id_maquina'
        );
        respond(200, ['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    if ($uriPath === '/api/events/recent' && $method === 'GET') {
        requireRole(['ADMIN']);

        $limit = (int)($_GET['limit'] ?? 30);
        if ($limit < 1 || $limit > 200) {
            $limit = 30;
        }

        $pdo = createPdo($env);
        $sql =
            'SELECT lm.id_log, lm.id_maquina, m.codigo_visible, lm.fecha_hora, lm.tipo_evento, lm.nivel, lm.payload
             FROM log_maquina lm
             INNER JOIN maquina m ON m.id_maquina = lm.id_maquina
             ORDER BY lm.id_log DESC
             LIMIT ' . $limit;
        $rows = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
        respond(200, ['data' => $rows]);
    }

    if ($uriPath === '/api/dashboard' && $method === 'GET') {
        requireRole(['ADMIN']);

        $pdo = createPdo($env);

        $machines = $pdo->query(
            'SELECT id_maquina, codigo_visible, tipo_maquina, estado_actual, activa FROM maquina ORDER BY id_maquina'
        )->fetchAll(PDO::FETCH_ASSOC);

        $events = $pdo->query(
            'SELECT lm.id_log, m.codigo_visible, lm.fecha_hora, lm.tipo_evento, lm.nivel
             FROM log_maquina lm
             INNER JOIN maquina m ON m.id_maquina = lm.id_maquina
             ORDER BY lm.id_log DESC LIMIT 15'
        )->fetchAll(PDO::FETCH_ASSOC);

        $systemState = fetchSystemState($pdo);

        respond(200, [
            'machines' => $machines,
            'recent_events' => $events,
            'system' => $systemState,
        ]);
    }

    if (preg_match('#^/api/machines/(\d+)/command$#', $uriPath, $matches) === 1 && $method === 'POST') {
        requireRole(['ADMIN']);

        $machineId = (int)$matches[1];
        $payload = parseJsonBody();
        $action = strtoupper((string)($payload['action'] ?? ''));

        $allowed = ['START', 'STOP', 'RESTART', 'STATUS', 'PING'];
        if (!in_array($action, $allowed, true)) {
            respond(422, ['error' => 'invalid_action', 'allowed' => $allowed]);
        }

        $pdo = createPdo($env);
        $pdo->beginTransaction();

        $machine = fetchMachine($pdo, $machineId);
        if ($machine === null) {
            $pdo->rollBack();
            respond(404, ['error' => 'machine_not_found']);
        }

        $topic = machineCommandTopic((string)$machine['codigo_visible']);
        $mqttPayload = json_encode(['accion' => strtolower($action)], JSON_UNESCAPED_UNICODE);

        publishMqtt($env, $topic, $mqttPayload, false);
        persistCommandLog(
            $pdo,
            $machineId,
            $action,
            $mqttPayload,
            'MQTT command published by API',
            (int)$_SESSION['user_id']
        );

        $pdo->commit();

        respond(202, [
            'status' => 'accepted',
            'machine_id' => $machineId,
            'topic' => $topic,
            'action' => $action,
        ]);
    }

    if ($uriPath === '/api/system/door/command' && $method === 'POST') {
        requireRole(['ADMIN']);

        $payload = parseJsonBody();
        $action = strtolower((string)($payload['action'] ?? ''));
        $allowed = ['abrir', 'cerrar'];

        if (!in_array($action, $allowed, true)) {
            respond(422, ['error' => 'invalid_action', 'allowed' => $allowed]);
        }

        publishMqtt($env, 'kwl/sistema/puerta/comando', json_encode(['accion' => $action]), false);
        respond(202, ['status' => 'accepted', 'topic' => 'kwl/sistema/puerta/comando', 'action' => $action]);
    }

    if ($uriPath === '/api/system/light/command' && $method === 'POST') {
        requireRole(['ADMIN']);

        $payload = parseJsonBody();
        $action = strtolower((string)($payload['action'] ?? ''));
        $allowed = ['on', 'off'];

        if (!in_array($action, $allowed, true)) {
            respond(422, ['error' => 'invalid_action', 'allowed' => $allowed]);
        }

        publishMqtt($env, 'kwl/sistema/luces/comando', json_encode(['accion' => $action]), false);
        respond(202, ['status' => 'accepted', 'topic' => 'kwl/sistema/luces/comando', 'action' => $action]);
    }

    respond(404, ['error' => 'route_not_found']);
} catch (Throwable $exception) {
    respond(500, [
        'error' => 'internal_error',
        'message' => $exception->getMessage(),
    ]);
}

function parseJsonBody(): array
{
    $raw = file_get_contents('php://input') ?: '{}';
    $decoded = json_decode($raw, true);

    if (!is_array($decoded)) {
        throw new RuntimeException('invalid_json_payload');
    }

    return $decoded;
}

function isAuthenticated(): bool
{
    return isset($_SESSION['user_id'], $_SESSION['user_role']) && (int)$_SESSION['user_id'] > 0;
}

function requireRole(array $roles): void
{
    if (!isAuthenticated()) {
        respond(401, ['error' => 'auth_required']);
    }

    $current = strtoupper((string)($_SESSION['user_role'] ?? ''));
    $normalized = array_map(static fn(string $role): string => strtoupper($role), $roles);

    if (!in_array($current, $normalized, true)) {
        respond(403, ['error' => 'insufficient_role']);
    }
}

function verifyPassword(string $storedHash, string $plainPassword): bool
{
    if (str_starts_with($storedHash, 'sha256:')) {
        $raw = substr($storedHash, 7);
        return hash_equals($raw, hash('sha256', $plainPassword));
    }

    if (str_starts_with($storedHash, '$2y$') || str_starts_with($storedHash, '$2a$') || str_starts_with($storedHash, '$2b$')) {
        return password_verify($plainPassword, $storedHash);
    }

    return hash_equals($storedHash, $plainPassword);
}

function loadEnv(string $path): array
{
    $values = [];

    if (is_file($path)) {
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }
            [$key, $value] = explode('=', $line, 2);
            $values[trim($key)] = trim($value);
        }
    }

    return $values;
}

function createPdo(array $env): PDO
{
    $host = $env['DB_HOST'] ?? '127.0.0.1';
    $port = $env['DB_PORT'] ?? '3306';
    $name = $env['DB_NAME'] ?? 'kwl_lavanderia';
    $user = $env['DB_USER'] ?? 'backend';
    $pass = $env['DB_PASS'] ?? '';

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $name);

    return new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}

function checkRedis(array $env): bool
{
    if (!class_exists('Redis')) {
        return false;
    }

    $redis = new Redis();
    $host = $env['REDIS_HOST'] ?? '127.0.0.1';
    $port = (int)($env['REDIS_PORT'] ?? 6379);

    if (!$redis->connect($host, $port, 2.0)) {
        return false;
    }

    return $redis->ping() === true || $redis->ping() === '+PONG';
}

function checkMqttConnectivity(array $env): bool
{
    try {
        $topic = 'kwl/test/health';
        $payload = json_encode(['source' => 'api-health', 'time' => date(DATE_ATOM)]);
        publishMqtt($env, $topic, $payload, false);
        return true;
    } catch (Throwable $exception) {
        return false;
    }
}

function publishMqtt(array $env, string $topic, string $payload, bool $retained): void
{
    $host = $env['MQTT_HOST'] ?? '127.0.0.1';
    $port = $env['MQTT_PORT'] ?? '1883';
    $user = $env['MQTT_USER'] ?? 'kwl';
    $pass = $env['MQTT_PASS'] ?? '';
    $retainFlag = $retained ? '-r' : '';

    $command = sprintf(
        'mosquitto_pub -h %s -p %s -u %s -P %s -t %s -m %s %s 2>&1',
        escapeshellarg($host),
        escapeshellarg((string)$port),
        escapeshellarg($user),
        escapeshellarg($pass),
        escapeshellarg($topic),
        escapeshellarg($payload),
        $retainFlag
    );

    $output = [];
    $exitCode = 0;
    exec($command, $output, $exitCode);

    if ($exitCode !== 0) {
        throw new RuntimeException('mqtt_publish_failed: ' . implode("\n", $output));
    }
}

function fetchMachine(PDO $pdo, int $machineId): ?array
{
    $stmt = $pdo->prepare('SELECT id_maquina, codigo_visible FROM maquina WHERE id_maquina = :id LIMIT 1');
    $stmt->execute(['id' => $machineId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row ?: null;
}

function machineCommandTopic(string $code): string
{
    $normalized = strtoupper(trim($code));

    if (preg_match('/^L(\d+)$/', $normalized, $matches) === 1) {
        return 'kwl/maquinas/lavadora' . $matches[1] . '/comando';
    }

    if (preg_match('/^S(\d+)$/', $normalized, $matches) === 1) {
        return 'kwl/maquinas/secadora' . $matches[1] . '/comando';
    }

    return 'kwl/maquinas/' . strtolower($normalized) . '/comando';
}

function persistCommandLog(PDO $pdo, int $machineId, string $action, string $payload, string $detail, int $userId): void
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? null;

    $log = $pdo->prepare(
        'INSERT INTO log_maquina (id_lavanderia, id_maquina, fecha_hora, tipo_evento, nivel, payload, procesado)
         VALUES (1, :machine_id, NOW(), :event, "INFO", :payload, 0)'
    );

    $log->execute([
        'machine_id' => $machineId,
        'event' => 'CMD_' . $action,
        'payload' => $payload,
    ]);

    $audit = $pdo->prepare(
        'INSERT INTO auditoria (id_usuario, id_lavanderia, id_maquina, fecha_hora, accion, entidad_afectada, id_entidad_afectada, detalle, ip_origen)
         VALUES (:user_id, 1, :machine_id, NOW(), :action, "MAQUINA", :machine_id, :detail, :ip)'
    );

    $audit->execute([
        'user_id' => $userId,
        'machine_id' => $machineId,
        'action' => 'COMMAND_' . $action,
        'detail' => $detail,
        'ip' => $ip,
    ]);
}

function fetchSystemState(PDO $pdo): array
{
    $rows = $pdo->query(
        "SELECT clave, valor, fecha_actualizacion
         FROM configuracion
         WHERE ambito = 'GLOBAL' AND clave IN ('SISTEMA_PUERTA_ESTADO', 'SISTEMA_LUZ_ESTADO')"
    )->fetchAll(PDO::FETCH_ASSOC);

    $result = [
        'puerta' => ['estado' => 'DESCONOCIDO'],
        'luz' => ['estado' => 'DESCONOCIDO'],
    ];

    foreach ($rows as $row) {
        if ($row['clave'] === 'SISTEMA_PUERTA_ESTADO') {
            $result['puerta'] = ['estado' => $row['valor'], 'actualizado' => $row['fecha_actualizacion']];
        }

        if ($row['clave'] === 'SISTEMA_LUZ_ESTADO') {
            $result['luz'] = ['estado' => $row['valor'], 'actualizado' => $row['fecha_actualizacion']];
        }
    }

    return $result;
}

function respond(int $statusCode, array $data): void
{
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
