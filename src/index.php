<?php
/*
 * Miucode text editor
 * Author: Mihkel Oviir
 * This work is licensed under MIT License, see http://www.opensource.org/licenses/mit-license.php
 * 
 */

session_start();

// Configuration
$config = parse_ini_file(__DIR__.'/config.ini', true);

if(!$config['status']){
	die('Closed!');
}

// include MiuCode
include './miucode.php';

// run MiuCode
$mc = new MiuCode($config);