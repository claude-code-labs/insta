<?php
$VERIFY_TOKEN = 'ig_verify_cloud_code_labs_2026';

function get_query_param($name) {
    $alt = str_replace('.', '_', $name);
    return $_GET[$name] ?? $_GET[$alt] ?? null;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mode = get_query_param('hub.mode');
    $token = get_query_param('hub.verify_token');
    $challenge = get_query_param('hub.challenge');

    if ($mode === 'subscribe' && hash_equals($VERIFY_TOKEN, $token)) {
        http_response_code(200);
        header('Content-Type: text/plain');
        echo $challenge;
        exit;
    }

    http_response_code(403);
    echo 'Token de verification invalide';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = file_get_contents('php://input');

    file_put_contents(
        __DIR__ . '/instagram-webhook.log',
        date('c') . ' ' . $body . PHP_EOL,
        FILE_APPEND
    );

    http_response_code(200);
    header('Content-Type: text/plain');
    echo 'EVENT_RECEIVED';
    exit;
}

http_response_code(405);
echo 'Methode non autorisee';