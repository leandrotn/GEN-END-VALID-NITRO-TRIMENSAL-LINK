const axios = require('axios');
const fs = require('fs');

const token = "TEU TOKEN AQUI";

async function gerarCodigos(quantidade) {
    const caracteres = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const tamanho = 24;
    let codigos = [];

    for (let i = 0; i < quantidade; i++) {
        let codigo = '';
        for (let j = 0; j < tamanho; j++) {
            const indice = Math.floor(Math.random() * caracteres.length);
            codigo += caracteres.charAt(indice);
        }
        codigos.push(codigo);
    }

    fs.writeFileSync('trimensais.txt', codigos.map(codigo => `https://discord.com/billing/promotions/${codigo}`).join('\n'));
    console.log(`Códigos gerados (${quantidade}) e salvos em trimensais.txt`);
}

async function verificarCodigos() {
    let checkados = 0;
    let validos = 0;
    let invalidos = 0;

    const links = fs.readFileSync('trimensais.txt', 'utf8').split('\n').filter(Boolean);

    for (const link of links) {
        let codigo = null;
        if (link.startsWith('https://discord.com/billing/promotions/')) {
            codigo = link.replace('https://discord.com/billing/promotions/', '');
        } else if (link.startsWith('https://promos.discord.gg/')) {
            codigo = link.replace('https://promos.discord.gg/', '');
        } else {
            console.log("[ERRO] Esse link não é suportado pelo checker!\n");
            continue;
        }

        const url = `https://discord.com/api/v9/entitlements/gift-codes/${codigo}`;
        const querystring = { country_code: "BR", with_application: "false", with_subscription_plan: "true" };
        const headers = {
            "Authorization": token,
        };

        try {
            const response = await axios.get(url, { params: querystring, headers });
            if (response.status === 200) {
                if (!response.data.redeemed && response.data.uses < 1) {
                    validos++;
                    console.log(`[VALIDO] O link ${link} é válido\n`);
                    // Enviar link válido para o webhook
                    await enviarParaWebhook(link);
                } else {
                    invalidos++;
                    console.log(`[INVALIDO] O link ${link}\n`);
                }
            } else {
                invalidos++;
                console.log(`[INVALIDO] O link ${link}\n`);
            }
        } catch (error) {
            invalidos++;
            console.log(`[ERRO] Ocorreu um erro ao verificar o link ${link}: ${error.message}\n`);
        }
        checkados++;
    }

    console.log(`[FINALIZADO] | Válidos: ${validos} | Inválidos: ${invalidos} | Total: ${checkados}\n`);
}

async function enviarParaWebhook(link) {
    const webhookURL = "TUA WEBHOOK";
    const payload = {
        content: `Código válido encontrado: ${link}`
    };

    try {
        await axios.post(webhookURL, payload);
        console.log("[INFO] Mensagem enviada para o webhook\n");
    } catch (error) {
        console.log(`[ERRO] Ocorreu um erro ao enviar a mensagem para o webhook: ${error.message}\n`);
    }
}

async function menu() {
    console.log("Menu:");
    console.log("1. Gerar códigos e salvar em trimensais.txt");
    console.log("2. Verificar a validade dos códigos em trimensais.txt");

    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.question("Escolha uma opção: ", async (opcao) => {
        if (opcao === '1') {
            readline.question("Quantidade de códigos a serem gerados: ", async (quantidade) => {
                await gerarCodigos(parseInt(quantidade));
                readline.close();
            });
        } else if (opcao === '2') {
            await verificarCodigos();
            readline.close();
        } else {
            console.log("Opção inválida");
            readline.close();
        }
    });
}

menu();
