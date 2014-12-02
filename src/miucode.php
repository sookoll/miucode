<?php
/*
 * Miucode text editor
 * Author: Mihkel Oviir
 * This work is licensed under MIT License, see http://www.opensource.org/licenses/mit-license.php
 * 
 */

class MiuCode {
	
	private $conf = null;
	private $user_in = false;
    private $base_path = __DIR__;
    private $base_url = null;
    private $texts = array(
        'error_general' => 'Tekkis viga!',
        'error_unauthorized' => 'You do not have permissions!',
        'error_invalid_file' => 'Invalid file or path',
        'error_binary_file' => 'Üritasid avada faili, mille muutmine pole lubatud',
        'error_invalid_request' => 'Invalid request',
        'error_file_exists' => 'Fail juba eksisteerib!'
    );
	
	public function __construct($conf){
		
        // Config
        $this->conf = $conf;
        $this->base_url = $this->get_base_url();
        
		// grant access
		if(isset($_SESSION['writer_logged_in']) && $_SESSION['writer_logged_in'] === true){
			$this->user_in = true;
		}
		
		// handle routing
		$this->handleRouting();
		
	}
	
	private function handleRouting(){
		
		if(isset($_GET['login'])){
			$this->do_login();
			exit;
		}
		
		else if(isset($_GET['logout'])){
			$this->do_logout();
			exit;
		}
		
		else if(isset($_GET['explore'])){
			$this->do_explore();
			exit;
		}
		
		else if(isset($_GET['open_file'])){
			$this->open_file();
			exit;
		}
		
		else if(isset($_GET['save_file'])){
			$this->do_save();
			exit;
		}
        
        else if(isset($_GET['create_file'])){
			$this->do_create();
			exit;
		}
        
        else if(isset($_GET['create_dir'])){
			$this->do_dir();
			exit;
		}
        
        else if(isset($_GET['delete_file'])){
			$this->do_delete();
			exit;
		}
        
        else if(isset($_GET['upload'])){
			$this->do_upload();
			exit;
		}
		
		else {
			$this->do_render();
			exit;
		}
	}
	
	private function do_login(){
		if(isset($_POST['user_id']) && isset($_POST['user_pwd'])) {
			if($_POST['user_id'] === $this->conf['user']['name'] && $_POST['user_pwd'] === $this->conf['user']['pass']) {
				// set the session
				$_SESSION['writer_logged_in'] = true;
			}
		}
		// redirect
		header('Location: '.$this->base_url);
	}
	
	private function do_logout(){
		unset($_SESSION['writer_logged_in']);
		header('Location: '.$this->base_url);
	}
	
	private function do_render(){
		if($this->user_in){
			// editor view
			$html = $this->base_path.'/ui/editor.html';
		}else{
			// login page
			$html = $this->base_path.'/ui/login.html';
		}
		echo $this->parse($html);
	}
	
	private function do_explore(){
		if(!$this->user_in)
            $this->error_handler(401, 'error_unauthorized');
        
		$path = $this->base_path.'/'.$this->conf['content_path'];
		$data = array();
		$_POST['dir'] = urldecode($_POST['dir']);
		if( file_exists($path.$_POST['dir']) ) {
			$dirid = str_replace('/','_',$_POST['dir']);
			$files = scandir($path.$_POST['dir']);
			natcasesort($files);
			if( count($files) > 2 ) { /* The 2 accounts for . and .. */
				$i=0;
				// All dirs
				foreach( $files as $file ) {
					if( file_exists($path.$_POST['dir'] . $file) && $file != '.' && $file != '..' && is_dir($path.$_POST['dir'] . $file) ) {
						$data[] = array(
                            'id' => htmlentities($dirid.$i),
                            'path' => htmlentities($_POST['dir'].$file.'/'),
                            'type' => 'directory',
                            'name' => htmlentities($file)
                        );
					}
					$i++;
				}
				// All files
				foreach( $files as $file ) {
					if( file_exists($path.$_POST['dir'] . $file) && $file != '.' && $file != '..' && !is_dir($path.$_POST['dir'] . $file) ) {
						$ext = preg_replace('/^.*\./', '', $file);
                        $data[] = array(
                            'id' => htmlentities($dirid.$i),
                            'path' => htmlentities($_POST['dir'].$file),
                            'type' => 'file',
                            'ext' => 'ext_'.$ext,
                            'name' => htmlentities($file)
                        );
					}
					$i++;
				}
			}
		}
		header('Content-Type: text/json');
		echo json_encode($data);
	}
    
	private function open_file(){
		if(!$this->user_in)
			$this->error_handler(401, 'error_unauthorized');
		
		if(empty($_POST['file']))
            $this->error_handler(500, 'error_invalid_file');
        
        $_POST['file'] = urldecode($_POST['file']);
        $filename = $this->base_path.'/'.$this->conf['content_path'].$_POST['file'];
		if(@is_file($filename)) {
			$types = explode(',', $this->conf['types']['editable']);
            if(in_array(pathinfo($filename, PATHINFO_EXTENSION),$types))
                echo file_get_contents($filename);
            else
                $this->error_handler(500, 'error_binary_file');
            
		} else
            $this->error_handler(500, 'error_invalid_file');
	}
	
	private function do_save(){
		if(!$this->user_in)
			$this->error_handler(401, 'error_unauthorized');
		
		$tmp = array('status'=>0);
        $file = urldecode(trim($_POST['file']));
		
		if(empty($file) || strpos($file, '../') !== false || !is_file($this->base_path.'/'.$this->conf['content_path'].$file))
            $this->error_handler(500, 'error_invalid_file');
        
        $fs = fopen($this->base_path.'/'.$this->conf['content_path'].$file,'w') or die('Error on file opening!');
        fwrite($fs,trim($_POST['content']));
        fclose($fs);
        $tmp['status'] = 1;
		
		header('Content-Type: text/json');
		echo json_encode($tmp);
	}
    
    private function do_create(){
		if(!$this->user_in)
			$this->error_handler(401, 'error_unauthorized');
		
		$tmp = array('status'=>0);
        $file = urldecode(trim($_POST['file']));
		
		if(empty($file) || strpos($file, '../') !== false || file_exists($this->base_path.'/'.$this->conf['content_path'].$file))
            $this->error_handler(500, 'error_invalid_file');
        
        $fs = fopen($this->base_path.'/'.$this->conf['content_path'].$file,'w') or $this->error_handler(500, 'error_invalid_file');
        fwrite($fs,trim($_POST['content']));
        fclose($fs);
        $tmp['status'] = 1;
		
		header('Content-Type: text/json');
		echo json_encode($tmp);
	}
    
    private function do_dir(){
		if(!$this->user_in)
			$this->error_handler(401, 'error_unauthorized');
		
		$tmp = array('status'=>0);
        $file = urldecode(trim($_POST['file']));
		
		if(empty($file) || strpos($file, '../') !== false || file_exists($this->base_path.'/'.$this->conf['content_path'].$file))
            $this->error_handler(500, 'error_invalid_file');
        
        if(mkdir($this->base_path.'/'.$this->conf['content_path'].$file, 0777, true))
            $tmp['status'] = 1;
		
		header('Content-Type: text/json');
		echo json_encode($tmp);
	}
    
    private function do_delete(){
		if(!$this->user_in)
			$this->error_handler(401, 'error_unauthorized');
		
		if(empty($_POST['file']))
            $this->error_handler(500, 'error_invalid_file');
        
        $file = urldecode($_POST['file']);
        $tmp = array(
			'status'=>0
		);
		if(is_file($this->base_path.'/'.$this->conf['content_path'].$file)) {
			if(unlink($this->base_path.'/'.$this->conf['content_path'].$file))
                $tmp['status'] = 1;
		} else if(is_dir($this->base_path.'/'.$this->conf['content_path'].$file)) {
            if($this->recursiveRemoveDirectory($this->base_path.'/'.$this->conf['content_path'].$file))
                $tmp['status'] = 1;
        } else
            $this->error_handler(500, 'error_invalid_file');
        echo json_encode($tmp);
	}
    
    private function do_upload(){
        if(!$this->user_in)
			$this->error_handler(401, 'error_unauthorized');
        
        if (!isset($_REQUEST['path']) || empty($_FILES['fileupload']) || $_FILES['fileupload']['error'] != UPLOAD_ERR_OK)
            $this->error_handler(500, 'error_invalid_request');
        
        $tmp = array(
			'status' => 0,
            'files' => $_FILES['fileupload']
		);
        
        $path = urldecode(trim($_REQUEST['path']));
        if(is_dir($this->base_path.'/'.$this->conf['content_path'].$path)) {
            $target_file = $this->base_path.'/'.$this->conf['content_path'].$path . basename($_FILES['fileupload']['name']);
            if (file_exists($target_file)) {
                $this->error_handler(500, 'error_file_exists');
            }
            
            if (move_uploaded_file($_FILES['fileupload']['tmp_name'], $target_file)){
                $tmp['status'] = 1;
            }
        }

		header('Content-Type: text/json');
		echo json_encode($tmp);
    }
    
    /**
	 * Helper function to work out the base URL
	 *
	 * @return string the base url
	 */
	private function get_base_url() {

		$url = '';
		$request_url = (isset($_SERVER['REQUEST_URI'])) ? $_SERVER['REQUEST_URI'] : '';
		$script_url  = (isset($_SERVER['PHP_SELF'])) ? $_SERVER['PHP_SELF'] : '';
		if($request_url != $script_url) $url = trim(preg_replace('/'. str_replace('/', '\/', str_replace('index.php', '', $script_url)) .'/', '', $request_url, 1), '/');

		$protocol = $this->get_protocol();
		return rtrim(str_replace($url, '', $protocol . "://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']), '/');
	}
    
    /**
	 * Tries to guess the server protocol. Used in base_url()
	 *
	 * @return string the current protocol
	 */
	private function get_protocol() {
		$protocol = 'http';
		if(isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off'){
			$protocol = 'https';
		}
		return $protocol;
	}
    
    private function readFile($page){
        $fd = fopen($page,'r');
		$page = @fread($fd, filesize($page));
		fclose($fd);
		return $page;
	}
	
	private function parse($page,$tags = array()) {
		$page=(@file_exists($page))? $this->readFile($page):$page;
		if(sizeof($tags) > 0){
			foreach ($tags as $tag => $data) {
				$page = str_replace('{{ '.$tag.' }}',$data,$page);
			}
		}
		return $page;
	}
    
    private function recursiveRemoveDirectory($directory) {
        foreach(glob("{$directory}/*") as $file) {
            if(is_dir($file)) { 
                $this->recursiveRemoveDirectory($file);
            } else {
                unlink($file);
            }
        }
        if(rmdir($directory))
            return true;
    }
    
    private function error_handler($code = 500, $key = 'error_general'){
        header('HTTP/1.1 '.$code.' Internal Server Booboo');
        die($this->texts[$key]);
    }
}