<?php

namespace Stanford\GoogleStorageIntermediateBucket;
/** @var \Stanford\GoogleStorageIntermediateBucket\GoogleStorageIntermediateBucket $module */

try {
    echo json_encode($module->saveRecord());
} catch (\LogicException $e) {
    $module->emError($e->getMessage());
    http_response_code(404);
    echo json_encode(array('status' => 'error', 'message' => $e->getMessage()));
} catch (\Exception $e) {
    $module->emError($e->getMessage());
    http_response_code(404);
    echo json_encode(array('status' => 'error', 'message' => $e->getMessage()));
}
?>