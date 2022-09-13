<?php
/**
 * Database
 * 
 * @author Itay Gal
 * 
 */

require_once(__DIR__.'/constants.php');

class db {
    
    // database vars
    private $host;
    private $dbUser;
    private $dbPass;
    private $dbName;
    private $link;
    private $conn = false;
    
    // store the single instance of Database
    private $mpInstance;
    
    public function __construct($host=HOST, $user=USER, $pass=PASS, $db_name=DB_NAME){
        // check values and define defualt values if needed
        // database location
         $this->host = $host;
         $this->dbUser = $user;
         $this->dbPass = $pass;
         $this->dbName = $db_name;
         
         $this->connectDB();
    }
    
    public function connectDB(){
        // --------------------- Connect to the Databases ---------------------
        $this->mpInstance = new mysqli($this->host, $this->dbUser, $this->dbPass);
        if (!$this->mpInstance) {
            die("Could not connect: " . mysqli_error());
        }
        else{
            // --------------------- Select the Database ----------------------
            $dbSelected = $this->mpInstance->select_db($this->dbName);//mysqli_select_db($this->mpInstance, $this->dbName);
            if (!$dbSelected) {
                die ("Can't use internet_database : " . $this->mpInstance->error); //mysqli_error($this->mpInstance));
            }
            else{
                // seting UTF-8 for Hebrew support
                //$mysqli->query("SET NAMES 'utf8'");
            	//$mysqli->set_charset("utf8");
            	$this->mpInstance->query("SET NAMES 'utf8'");
                $this->conn = true;
            }
        }
    }
    
    public function disconnectDB(){
        if ($this->conn){
            mysqli_close($this->link);
            $this->conn = false;
        }
    }
    
   
    public function getInstance(){
        if (!$this->mpInstance){
            $this->mpInstance = new db();
        }
        return $this->mpInstance;
    }
    
    public function vref($arr) {
    	if (strnatcmp(phpversion(),'5.3') >= 0) {//Reference is required for PHP 5.3+
    		$refs = array();
    		foreach($arr as $key => $value) $refs[$key] = &$arr[$key];
    		return $refs;
    	}
    	return $arr;
    }
    
    public function query($sql, $params){
    	if ($params == null){
    		return $this->query_no_prep($sql);
    	}
    	
    	$stmt = $this->mpInstance->stmt_init();
    	$stmt->prepare($sql);
    	call_user_func_array( array( $stmt, 'bind_param' ), $this->vref($params) );
    	$stmt->execute();
     	//$result = $stmt->get_result() or die("Error: ". mysqli_error($this->mpInstance). " with query ". $query);
        //return $result;
    }
	
	public function querySafe($sql, $types, $params){
    	if ($params == null || $types == null){
    		return $this->query_no_prep($sql);
    	}
    	
    	$stmt = $this->mpInstance->stmt_init();
    	$stmt->prepare($sql);
		$stmt->bind_param($types, ...$params);
    	$stmt->execute();
		return $stmt;
    }
    
    public function query_no_prep($sql){
    	$result = $this->mpInstance->query($sql) or die("Error: ". mysqli_error($this->mpInstance). " with query ". $query);
    	return $result;
    }
}
?>
