<?php

class AjaxResponse {

    private $success = false;
    private $data = "Empty ajax response.";

    function __construct($success, $data) {
        $this->success = $success;
        $this->data = $data;
    }
    
    function toArray(){
        $array = array(
            "success" => $this->success,
            "data" => $this->data
        );
        return $array;
    }
    
    public function setSuccess($success) {
        $this->success = $success;
    }

    public function setData($data) {
        $this->data = $data;
    }



}

?>