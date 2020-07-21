from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from datetime import datetime

# engine = create_engine("postgres://hdezvbstupiolt:3e27909cb8157e39cef0e6a6d017558b7a96e7f71b3020f936e22a2cbd54612d@ec2-34-206-252-187.compute-1.amazonaws.com:5432/d84hgcueafmlak")
engine = create_engine("postgres://ujzioqhvxoferw:dbf64f996020ff2cf325e98bae458fab13e599813ef935afed3df68cb8d9b249@ec2-52-71-55-81.compute-1.amazonaws.com:5432/dctkuqq7oe3aua")
db = scoped_session(sessionmaker(bind=engine))
def main():
    # CREATE TABLES
    db.execute('CREATE TABLE "people" ('
               'id SERIAL PRIMARY KEY,'
               'date_created VARCHAR NOT NULL,'
               'username VARCHAR NOT NULL);')

    db.execute('CREATE TABLE "channels" ('
               'id SERIAL PRIMARY KEY,'
               'chname VARCHAR NOT NULL,'
               'author VARCHAR NOT NULL,'
               'type VARCHAR NOT NULL);')

    db.execute('CREATE TABLE "messages" ('
               'id SERIAL PRIMARY KEY,'
               'author VARCHAR NOT NULL,'
               'text VARCHAR NOT NULL,'
               'date VARCHAR NOT NULL,'
               'chname VARCHAR NOT NULL);')
    db.commit()

    now = datetime.now()
    # formatted_date = now.strftime('%Y-%m-%d %H:%M:%S')
    now = now.strftime('%m/%d %H:%M')
    # FILL UP system data
    db.execute("INSERT INTO channels (chname, author, type) VALUES (:chname, :author, :type)",
               {"chname": "CS50x", "author": "admin", "type": "predef"})
    db.execute("INSERT INTO channels (chname, author, type) VALUES (:chname, :author, :type)",
               {"chname": "Python", "author": "admin", "type": "predef"})
    db.execute("INSERT INTO channels (chname, author, type) VALUES (:chname, :author, :type)",
               {"chname": "SQL", "author": "admin", "type": "predef"})
    db.execute("INSERT INTO channels (chname, author, type) VALUES (:chname, :author, :type)",
               {"chname": "Flask", "author": "admin", "type": "predef"})
    db.execute("INSERT INTO messages (author, text, date, chname) VALUES (:author, :text, :date, :chname)",
              {"author": "javier", "text": "Hello World!", "date": now, "chname": "CS50x"})
    db.execute("INSERT INTO people (date_created, username) VALUES (:date_created, :username)",
              {"date_created": now, "username": "javier"})
    db.commit()

if __name__ == "__main__":
    main()
