from flask_session import Session
from flask import Flask, session, jsonify, render_template, request
from flask_socketio import SocketIO, emit
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from datetime import datetime

app = Flask(__name__)
app.config["SECRET_KEY"] = b'_5#y2L"F4Q8z\n\xec]/'
socketio = SocketIO(app)
app.config['SESSION_TYPE'] = 'filesystem'
Session(app)
engine = create_engine("postgres://ujzioqhvxoferw:dbf64f996020ff2cf325e98bae458fab13e599813ef935afed3df68cb8d9b249@ec2-52-71-55-81.compute-1.amazonaws.com:5432/dctkuqq7oe3aua")
db = scoped_session(sessionmaker(bind=engine))

messages = {"Default":[], "Python":[], "C/C++":[], "html/css/js":[]}
channels = [{"chname": "Default", "chtype": "predef", "chauth": "admin"},
            {"chname": "Python",  "chtype": "predef", "chauth": "admin"},
            {"chname": "C/C++",  "chtype": "predef", "chauth": "admin"},
            {"chname": "html/css/js",  "chtype": "predef", "chauth": "admin"}]
users = []
@app.route("/")
def login():
    if session.get("username") is None or session.get("username") == 'null':
        return render_template("login.html")
    else:
        return render_template("home.html")

@app.route("/home", methods=["GET", "POST"])
def home():
    if request.method == "GET":
        return render_template("login.html")
    if session.get("username") is None:
        user_username = request.form.get("username")
        chan_name     = request.form.get("chname")
        session["username"]=user_username
        all_users = db.execute(f"SELECT username FROM people").fetchall()
        all_ppl   = [u.username for u in all_users]
        if user_username not in all_ppl:
            db.execute("INSERT INTO people (date_created, username) VALUES (:date_created, :username)",
                      {"date_created": getNow(), "username": user_username})
            db.commit()
        # users.append(user_username)
    return render_template("home.html")

# Access the current list of channels
@app.route("/channels", methods=["POST"])
def channnels():
    query_results = db.execute(f"SELECT * FROM channels").fetchall()
    chnls = [{"chname": ch.chname,  "chtype": ch.type, "chauth": ch.author} for ch in query_results]
    print("ajax request to /channels")
    return jsonify(chnls)

# Access the current list of messages for a given channel
@app.route("/get_messages", methods=["POST"])
def get_messages():
    # get messages for that channel
    chnl = request.form.get("chnl")
    ml = db.execute("SELECT * FROM messages WHERE chname = :chname ORDER BY id", {"chname": chnl}).fetchall()
    mensajes = [{'msgText': x.text, 'msgUser':x.author,'msgTime':x.date } for x in ml]
    print("ajax /get_messages for ", chnl)
    return jsonify(mensajes)

@socketio.on("submit message")
def messageIn(data):
    print(f"{data['emitMSG']['msgUser']} SUBMITTIG message {data['emitMSG']['msgText']} to {data['emitCH']}")
    db.execute("INSERT INTO messages (author, text, date, chname) VALUES (:author, :text, :date, :chname)",
              {"author":data['emitMSG']['msgUser'], "text":data['emitMSG']['msgText'],  "date": getNow(), "chname":data["emitCH"] })
    db.commit()
    ml = db.execute("SELECT * FROM messages WHERE chname = :chname ORDER BY id",
                        {"chname": data["emitCH"]}).fetchall()
    mensajes = [{'msgText': x.text, 'msgUser':x.author,'msgTime':x.date } for x in ml]
    returnlst = { "emitCH":data["emitCH"], "emitMSG":mensajes }
    emit("emit messages", returnlst, broadcast=True)





@socketio.on("submit channel")
def channelIn(chn):
    print(f"{chn['chauth']} SUBMITING channel {chn['chname']}")
    db.execute("INSERT INTO channels (chname, author, type) VALUES (:chname, :author, :type)",
               {"chname":chn["chname"], "author":chn["chauth"], "type": "usr"})
    db.commit()
    query_results = db.execute(f"SELECT * FROM channels").fetchall()
    chnls = [{"chname": ch.chname,  "chtype": ch.type, "chauth": ch.author} for ch in query_results]
    emit("emit channels", chnls, broadcast=True)

# Delete channel and messages for that channel
@socketio.on("delete channel")
def channelOut(chn):
    ur = session.get("username")
    print(f"{ur} DELITING channel {type(chn)}")

    db.execute("DELETE FROM channels WHERE chname = :chname", {"chname":chn})
    db.execute("DELETE FROM messages WHERE chname = :chname", {"chname":chn})
    db.commit()
    query_results = db.execute(f"SELECT * FROM channels").fetchall()
    chnls = [{"chname": ch.chname,  "chtype": ch.type, "chauth": ch.author} for ch in query_results]
    emit("emit channels", chnls, broadcast=True)


def getNow():
    now = datetime.now()
    return now.strftime('%m/%d/%Y %H:%M')

if __name__ == "__main__":
    app.run()
