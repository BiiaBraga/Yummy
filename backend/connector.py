import mysql.connector

def connect():
    return mysql.connector.connect(
        host="10.1.44.33",
        user="yummy_user",
        password="senha123",
        database="Yummy"
    )