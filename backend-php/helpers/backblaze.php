<?php
// backend-php/helpers/backblaze.php

define('B2_ENDPOINT',   'https://s3.us-east-005.backblazeb2.com');
define('B2_ACCESS_KEY', '0057ba6d7a5725c0000000002');
define('B2_SECRET_KEY', 'K005XvUqydtIZQvuNBYCM/UDhXfrWLQ');
define('B2_BUCKET',     'ccgnimex');
define('B2_REGION',     'us-east-005');
define('B2_CDN_URL',    'https://file.ccgnimex.my.id/file/ccgnimex/');

/**
 * Upload a file to Backblaze B2 using the S3-compatible API with AWS Signature V4.
 *
 * @param string $fileContent   Raw file bytes
 * @param string $contentType   MIME type
 * @param string $remotePath    Path in bucket, e.g. "dokasah/berkas/slug/ktp.jpg"
 * @return array{success: bool, url?: string, error?: string}
 */
function uploadToB2(string $fileContent, string $contentType, string $remotePath): array {
    $host       = B2_BUCKET . '.' . parse_url(B2_ENDPOINT, PHP_URL_HOST);
    $url        = "https://$host/$remotePath";
    $datetime   = gmdate('Ymd\THis\Z');
    $date       = gmdate('Ymd');
    $region     = B2_REGION;
    $service    = 's3';

    // Build canonical request
    $payloadHash   = hash('sha256', $fileContent);
    $canonicalUri  = '/' . rawurlencode($remotePath);
    // Fix double-encoding: S3 needs single-encoded paths
    $canonicalUri  = '/' . implode('/', array_map('rawurlencode', explode('/', $remotePath)));
    $canonicalQuery = '';
    $canonicalHeaders = implode("\n", [
        "content-type:$contentType",
        "host:$host",
        "x-amz-content-sha256:$payloadHash",
        "x-amz-date:$datetime",
    ]) . "\n";
    $signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

    $canonicalRequest = implode("\n", [
        'PUT',
        $canonicalUri,
        $canonicalQuery,
        $canonicalHeaders,
        $signedHeaders,
        $payloadHash,
    ]);

    // Build string to sign
    $credentialScope = "$date/$region/$service/aws4_request";
    $stringToSign = implode("\n", [
        'AWS4-HMAC-SHA256',
        $datetime,
        $credentialScope,
        hash('sha256', $canonicalRequest),
    ]);

    // Calculate signature
    $signingKey = hmacSha256("aws4_request",
        hmacSha256($service,
            hmacSha256($region,
                hmacSha256($date, "AWS4" . B2_SECRET_KEY, true),
            true),
        true),
    true);
    $signature = bin2hex(hash_hmac('sha256', $stringToSign, $signingKey, true));

    // Authorization header
    $authorization = "AWS4-HMAC-SHA256 Credential=" . B2_ACCESS_KEY . "/$credentialScope, SignedHeaders=$signedHeaders, Signature=$signature";

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => 'PUT',
        CURLOPT_POSTFIELDS     => $fileContent,
        CURLOPT_HTTPHEADER     => [
            "Authorization: $authorization",
            "Content-Type: $contentType",
            "x-amz-content-sha256: $payloadHash",
            "x-amz-date: $datetime",
            "Content-Length: " . strlen($fileContent),
        ],
        CURLOPT_SSL_VERIFYPEER => true,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $cdnUrl = B2_CDN_URL . $remotePath;
        return ['success' => true, 'url' => $cdnUrl];
    }

    return ['success' => false, 'error' => "Upload failed with HTTP $httpCode: $response"];
}

function hmacSha256(string $data, string $key, bool $raw = false): string {
    return hash_hmac('sha256', $data, $key, $raw);
}
