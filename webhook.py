from flask import Flask, request

app = Flask(__name__)

# Rota principal (resolverá o erro 404 da página inicial)
@app.route("/")
def home():
    return "FinBot Assistente está online!", 200

# Webhook
@app.route("/webhook", methods=["GET", "POST"])
def webhook():
    if request.method == "GET":
        return "Webhook está ativo!", 200
    elif request.method == "POST":
        data = request.json
        print("Recebido:", data)
        return "Dados recebidos", 200

# Executa o app no Render
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)