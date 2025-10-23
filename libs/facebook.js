// libs/facebook.js (VERSIÓN COMMONJS)

const axios = require('axios');
const vm = require('node:vm'); // Usamos require para el módulo 'vm'

// La función principal para descargar videos de Facebook
async function Facebook(url) {
    try {
        const body = new URLSearchParams({
            "sf_url": encodeURI(url),
            "sf_submit": "",
            "new": 2,
            "lang": "id",
            "app": "",
            "country": "id",
            "os": "Windows",
            "browser": "Chrome",
            "channel": "main",
            "sf-nomad": 1
        });

        const { data } = await axios({
            url: "https://worker.sf-tools.com/savefrom.php",
            method: "POST",
            data: body,
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "origin": "https://id.savefrom.net",
                "referer": "https://id.savefrom.net/",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36"
            }
        });

        // La lógica para ejecutar el script en un contexto aislado se mantiene
        let exec = '[]["filter"]["constructor"](b).call(a);';
        let modifiedData = data.replace(exec, `\ntry {\ni++;\nif (i === 2) scriptResult = ${exec.split(".call")[0]}.toString();\nelse (\n${exec.replace(/;/, "")}\n);\n} catch {}`);
        
        const context = {
            "scriptResult": "",
            "i": 0
        };
        vm.createContext(context);
        new vm.Script(modifiedData).runInContext(context);
        
        const result = JSON.parse(context.scriptResult.split("window.parent.sf.videoResult.show(")?.[1].split(");")?.[0]);
        return result;

    } catch (error) {
        console.error("[FACEBOOK DOWNLOADER ERROR]", error);
        // Lanzamos un error para que el comando que llama a esta función pueda manejarlo
        throw new Error('No se pudo obtener el video de Facebook. La URL podría ser inválida o privada.');
    }
}

// Exportamos la función usando module.exports
module.exports = {
    Facebook
};