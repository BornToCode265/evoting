CREATE DATABASE evoting;

USE evoting;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nationalID VARCHAR(50) NOT NULL UNIQUE,
    fullName VARCHAR(150) ,
    walletAddress VARCHAR(50) NOT NULL UNIQUE,
    encryptedPrivateKey TEXT NOT NULL,
    nationalIdStatus INT 
);
