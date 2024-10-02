import express from 'express';
import api from '@victorsouzaleal/lbot-api-comandos';
import axios from 'axios';
import path from 'path';
import * as hamma_sticker from 'wa-sticker-hamma'
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage, registerFont } from 'canvas';
const app = express();
const PORT = 3001;
const VIP_API_URL = 'http://localhost:3300/clientes';
const IP_ADDRESS = '168.228.20.74'; 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use((req, res, next) => {
  const start = Date.now(); 
  const clientIp = req.ip || req.connection.remoteAddress; 

  res.on('finish', () => {
    const duration = Date.now() - start; 
    console.log('DATE TIME	===>', new Date().toLocaleString('pt-br'));
    console.log(`IP  		    ===> ${clientIp}, Tempo de resposta: ${duration}ms `);
    console.log(`IP  		    ===> ${duration}ms`);

  });

  next(); 
});
const makerSticker = async (buffer, pack = 'Natsuki-bot', author = 'Faça em\n   (27)992666840') => {
  const sticker = new hamma_sticker.Sticker(buffer, {
    pack: pack || 'Natsuki-bot',
    author: author || 'Faça em\n   (27)992666840',
  });
  
  await sticker.build();
  const sticBuffer = await sticker.get();
  
  return sticBuffer;
};


const insertPhotoIntoTemplate = async (photoBuffer, pushname) => {
  const modelo = path.resolve('./fonts/VIPASS.png');
  const fontPath = path.resolve('./fonts/Phoenix Gaming.ttf');
const way= path.resolve('./fonts/')
  try {
    await fs.writeFile(way, photoBuffer);
    console.log('Imagem salva em ' + patch);
  }catch(err){
    console.log(err)
  }
  const patch = path.resolve('./fonts/tempEdited.png');
  registerFont(fontPath, { family: 'Phoenix' });
  const canvas = createCanvas(750, 1280);
  const ctx = canvas.getContext('2d');
  const templateImage = await loadImage(modelo);
  console.log('passo 2 ');
  ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);  
  const userImage = await loadImage(patch);
  const circleX = 390;
  const circleY = 595;
  const radius = 238;
  console.log('passo 3 ');
  ctx.save();
  ctx.beginPath();
  ctx.arc(circleX, circleY, radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(userImage, circleX - radius, circleY - radius, radius * 2, radius * 2);
  ctx.restore();
  const text = pushname;
  const textX = canvas.width / 2;
  const textY = circleY + radius + 330; 
  const fontSize = 115;
  ctx.font = `${fontSize}px "Phoenix"`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#D136F9';
  ctx.fillText(text, textX, textY);

  const buffer = canvas.toBuffer('image/png');
  console.log('passo 4 ');

  try {
    await fs.writeFile(patch, buffer);
    console.log('Imagem salva em ' + patch);
    return buffer;

  } finally {
    try {
      await fs.unlink(patch);
      console.log('Arquivo deletado: ' + patch);
    } catch (err) {
      console.error('Erro ao deletar arquivo:', err);
    }
  }
};
const autenticarUsuario = async (req, res, next) => {
  try {
    const { phone,kea } = req.body; 
    const response = await axios.get(VIP_API_URL);
    const usuariosVIP = response.data;

    const usuario = usuariosVIP.find((user) => user.id === phone);

    if (!usuario) {
      console.log('Usuário não autorizado detectado: ',phone);
      return res.status(401).json({ error: 'Usuário não é cadastrado ' });
    }

    if(usuario.kea !== kea){
      console.log('Usuário não autenticado detectado  ',kea);
      return res.status(401).json({ error: 'chave de autenticacao não esta correta ' });
    }
    if (usuario.tokens <= 0) {
      return res.status(403).json({ error: 'Você não tem tokens suficientes' });
    }

    req.usuario = usuario; 
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Erro ao verificar usuário VIP' });
  }
};

async function altertoken(user,credit) {
  axios.patch(`${VIP_API_URL}/${user}`, {
      token: credit
    }).then(() => {
      return {
          status: "success"
      }
    }
    ).catch(err => {
      console.log(`error: ${err}`);
      return {
          status: "error",
          message: {
              code: err.response?.status || err,
              text: err.response?.statusText || ''
          }
      }
    });
}
async function weather(cidade) {
  try {
      let clima = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURI(cidade)}&units=metric&appid=060a6bcfa19809c2cd4d97a212b19273&language=pt`);
      
      if (clima?.data?.cod === '404') {
          return `Uai... ${clima?.data?.message}`;
      } else if (clima?.data?.cod === 'ERR_BAD_REQUEST') {
          return `Uai... ${clima?.data?.message}`;
      }
      return clima;

  } catch (error) {
      console.error("Erro ao obter o clima: ", error);
      return "Ocorreu um erro ao obter o clima. Tente novamente mais tarde.";
  }
}

const debitarToken = async (phone) => {
  try {
    const response = await axios.get(VIP_API_URL);
    const usuariosVIP = response.data;

    const usuarioIndex = usuariosVIP.find((user) => user.id === phone);
    if (usuarioIndex) {
      usuarioIndex.token -= 1
      await altertoken(phone,usuarioIndex.token)
        console.log('token removido')
    }
    else console.log('PORQUE SENHO JEEEOVA TA VINDO PARA ELSE')
  } catch (error) {
    console.error('Erro ao debitar token:', error);
  }
};


app.post('/api/texto', autenticarUsuario, async (req, res) => {
  try {
    const { texto, phone } = req.body;
    const { resultado: resultadoTexto } = await api.IA.obterRespostaIA(texto, 'remetente');
    await debitarToken(phone);
    res.json({ resposta: resultadoTexto });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
});


app.post('/api/imagem/busca', autenticarUsuario, async (req, res) => {
  try {
    const { texto, phone } = req.body;
    const { resultado: resultadoImagem } = await api.IA.obterImagemIA(texto);
    res.json({ resposta: resultadoImagem });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
});
app.post('/api/imagem/criar', autenticarUsuario, async (req, res) => {
  try {
    const videoid = req.body.texto;
    const { phone } = req.body;

    const { resultado: resultadoTexto } = await api.Imagens.textoParaImagem(videoid);
    await debitarToken(phone);
      res.json({ resposta: resultadoTexto });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: `Erro ao processar a solicitação info do erro: ${JSON.stringify(error)}` });
  }
});
app.post('/api/mangas/', autenticarUsuario, async (req, res) => {
  try {
    const videoid = req.body.texto;

    const { resultado: resultadoTexto } = await api.Gerais.obterAnimesLancamento(videoid);
      res.json({ resposta: resultadoTexto });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: `Erro ao processar a solicitação info do erro: ${JSON.stringify(error)}` });
  }
});
app.post('/api/google/news', autenticarUsuario, async (req, res) => {
  try {
    const videoid = req.body.texto;
    const { resultado: resultadoTexto } = await api.Gerais.obterNoticias(videoid);
      res.json({ resposta: resultadoTexto });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: `Erro ao processar a solicitação info do erro: ${JSON.stringify(error)}` });
  }
});

app.post('/api/google/search', autenticarUsuario, async (req, res) => {
  try {
    const { texto, phone } = req.body;
    const { resultado: resultadoTexto } = await api.Gerais.obterPesquisaWeb(texto, 'remetente');
    await debitarToken(phone);
    res.json({ resposta: resultadoTexto });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
});

app.post('/api/youtube/detail', autenticarUsuario, async (req, res) => {
  try {
    const usuarioTexto = req.body.texto;
    const { phone } = req.body;

    const { resultado: resultadoTexto } = await api.Downloads.obterInfoVideoYT(usuarioTexto);
    await debitarToken(phone);
    res.json({ resposta: resultadoTexto });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
});
app.post('/api/youtube/mp3', autenticarUsuario, async (req, res) => {
  try {
    const videoid = req.body.texto;
    const { resultado: resultadoTexto } = await api.Downloads.obterYTMP3(videoid);
      res.json({ resposta: resultadoTexto });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar a solicitação' });
  }
});

app.post('/api/encurtador', autenticarUsuario, async (req, res) => {
  try {
    const videoid = req.body.texto;
    const { resultado: resultadoTexto } = await api.Gerais.encurtarLink(videoid);
      res.json({ resposta: resultadoTexto });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: `Erro ao processar a solicitação info do erro: ${JSON.stringify(error)}` });
  }
});
app.post('/api/sticker/maker', autenticarUsuario, async (req, res) => {
  try {
    const { pack, author } = req.body;
    const buffer = Buffer.from(req.body.texto.data); 
    const resultadoTexto = await makerSticker(buffer, pack, author);
    res.json({ resultadoTexto });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: `Erro ao processar a solicitação info do erro: ${JSON.stringify(error)}` });
  }
});
app.post('/api/sticker/toimg', autenticarUsuario, async (req, res) => {
  try {
    const sticker = req.body.texto;
    const { resultado: resultadoTexto } = await api.Stickers.stickerParaImagem(sticker);
      res.json({ resposta: resultadoTexto });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: `Erro ao processar a solicitação info do erro: ${JSON.stringify(error)}` });
  }
});
app.post('/api/audio/edit', autenticarUsuario, async (req, res) => {
  try {
    const audio = req.body.texto;
    const { resultado: resultadoTexto } = await api.Audios.obterAudioModificado(audio);
      res.json({ resposta: resultadoTexto });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: `Erro ao processar a solicitação info do erro: ${JSON.stringify(error)}` });
  }
});
app.post('/api/weather', autenticarUsuario, async (req, res) => {
  try {
    const local = req.body.texto;
     const {data:resultadoTexto} = await weather(local);
     console.log(resultadoTexto)
      res.json({ resposta: resultadoTexto });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: `Erro ao processar a solicitação info do erro: ${JSON.stringify(error)}` });
  }
});

app.post('/api/canvas/perfil', autenticarUsuario, async (req, res) => {
  try {
    console.log('criando imagem para usuario')
    const pushname= req.body.pushname
    const buffer = Buffer.from(req.body.texto.data); 
    const imageBuffer = await insertPhotoIntoTemplate(buffer, pushname);
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': imageBuffer.length
    });
    res.end(imageBuffer); 
    console.log('eu enviei imagemBuffer ')
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: `Erro ao processar a solicitação. Info do erro: ${JSON.stringify(error)}` });
  }
});

app.listen(PORT, IP_ADDRESS, () => {
  console.log(`Servidor rodando em http://${IP_ADDRESS}:${PORT}`);
});
