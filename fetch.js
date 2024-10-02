import axios from 'axios';

async function weather(cidade) {
    try {
        let clima = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURI(cidade)}&units=metric&appid=060a6bcfa19809c2cd4d97a212b19273&language=pt`);
        
        if (clima?.data?.cod === '404') {
            return `Uai... ${clima?.data?.message}`;
        } else if (clima?.data?.cod === 'ERR_BAD_REQUEST') {
            return `Uai... ${clima?.data?.message}`;
        }
        
        // Retorna os dados do clima caso a requisição seja bem-sucedida
        return clima.data;

    } catch (error) {
        console.error("Erro ao obter o clima: ", error);
        return "Ocorreu um erro ao obter o clima. Tente novamente mais tarde.";
    }
}

export default weather;
