from flask import Flask, request, jsonify
import os

app = Flask(__name__)

VERIFY_TOKEN = os.environ.get("VERIFY_TOKEN", "finbot123")

@app.route('/webhook', methods=['GET', 'POST'])
def webhook():
    if request.method == 'GET':
        mode = request.args.get("hub.mode")
        token = request.args.get("hub.verify_token")
        challenge = request.args.get("hub.challenge")

        if mode == "subscribe" and token == VERIFY_TOKEN:
            return challenge, 200
        else:
            return "Erro de verificação", 403

    elif request.method == 'POST':
        data = request.get_json()
        print("📨 Mensagem recebida:", data)

        # Aqui você pode tratar a mensagem recebida
        return jsonify({"status": "recebido"}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=3000)
