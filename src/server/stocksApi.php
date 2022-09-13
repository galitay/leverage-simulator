<?php

define( 'ROOT_DIR_M', dirname(__FILE__) );
require_once(ROOT_DIR_M.'/../class/constants.php');
require_once(ROOT_DIR_M.'/../class/db.php');

$db = new db();
$dbTable = "leverage";

$sql = "SELECT SPX.date, SPX.close as SPX ,COALESCE(NDX.close,0) as NDX, COALESCE(TQQQ.close,0) as TQQQ FROM SPX_history SPX LEFT JOIN NDX_history NDX on SPX.date = NDX.date LEFT JOIN TQQQ_history TQQQ ON NDX.date = TQQQ.date WHERE SPX.date > '1928-01-01' ORDER BY SPX.date";
$params = array();
$params = null;
$types = "";
$result = $db->querySafe($sql, $types, $params);
$stocksData = array();
while ($row = mysqli_fetch_assoc($result)){
    array_push($stocksData, $row);
}
echo json_encode($stocksData);
?>