<?php
header('Content-Type: text/plain; charset=utf-8');

echo "Connexion Instagram terminée.\n\n";

if (isset($_GET['code'])) {
    echo "Code reçu :\n";
    echo $_GET['code'];
    echo "\n\nCe code devra ensuite être échangé contre un token d'accès.";
    exit;
}

if (isset($_GET['error'])) {
    echo "Erreur Instagram :\n";
    echo $_GET['error'] . "\n";
    echo $_GET['error_description'] ?? '';
    exit;
}

echo "Aucun code reçu.";