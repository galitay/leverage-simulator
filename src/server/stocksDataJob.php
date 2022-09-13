<?php

define( 'ROOT_DIR_M', dirname(__FILE__) );
require_once(ROOT_DIR_M.'/../class/constants.php');
require_once(ROOT_DIR_M.'/../class/db.php');

$db = new db();
//$dbTable = "stocksData";

function CallAPI($method, $url, $data = false){
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);

    $result = curl_exec($curl);
    curl_close($curl);

    return $result;
}

function GetDataPerSymbol($db, $dbTable, $symbol){
    $apiKey = "PaLLIXyd6PIcJpMZ1xiEe4gQQBQgTRpY";
    $date=strtotime("-1 days");
    $startDate = date("Y-m-d", $date);
    $endDate = date("Y-m-d", $date);
    $days = "1";
    $apiUrl = "https://api.polygon.io/v2/aggs/ticker/" . $symbol . "/". "range" . "/" .  $days . "/" . "day" ."/" . $startDate . "/" . $endDate . "?adjusted=true&sort=asc&limit=120&apiKey=" . $apiKey;
    echo $apiUrl;
    /*
    $result = CallAPI("GET",$apiUrl);
    $data = json_decode($result);
    if ($data->resultsCount == 0){
        return;
    }
    $closeRate = $data->results[0]->c;
    $openRate = $data->results[0]->o;
    saveToDB($db, $dbTable, $symbol,  $startDate, $openRate, $closeRate);
    */
}

function saveToDB($db, $dbTable, $symbol, $date, $open, $close){
    $sql = "INSERT INTO " . $dbTable . " VALUES(?,?,?)"; 
	$params = array();
	$params = [$date, $open, $close];
	$types = "sdd";
	$stmt = $db->querySafe($sql, $types, $params);
    echo $symbol. "-". $date . "-". $open. "-". $close;
    echo "err " . $stmt->error;
}

$symbols = array("SPX","NDX",);
foreach ($symbols as $symbol) {
    GetDataPerSymbol($db, ($symbol . "_history"), $symbol);
}

/*
$date = strtotime("-1 days");
saveToDB($db, $dbTable, "NDX",  date("Y-m-d", $date), 100.34, 104.33);

*/
?>