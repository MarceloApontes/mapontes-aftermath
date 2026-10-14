# MAPONTES: AFTERMATH 🎮

Jogo TPS de ação e sobrevivência pós-apocalíptica em Babylon.js.

## Identidade do projeto
- **Protagonista:** Antônio, câmera híbrida (exploração afastada / mira sobre o ombro)
- **Inimigos iniciais:** João e Maria, civis hostis
- **Arte:** 3D estilizado, personagens GLB do Tripo3D, roupas fixas
- **Plataforma inicial:** navegador desktop
- **Independência:** sem copiar o código do MAPONTES FPS original

## Campanha planejada
1. Cidade Urbana — Condomínio: civis
2. Cidade Industrial: civis e gangues
3. Aeroporto: gangues e militares
4. Floresta — Portal Interplanetário: militares e criaturas de outros mundos

## Protótipo v0.1
O código e os modelos do protótipo inicial são entregues em um ZIP separado, que deve ser descompactado e enviado para este repositório preservando as pastas `src/` e `assets/characters/`.

Arquivos esperados:
```text
index.html
src/main.js
assets/characters/antonio.glb
assets/characters/joao.glb
assets/characters/maria.glb
```

**Estado:** repositório inicial, aguardando o envio dos arquivos do protótipo; ainda não há jogo publicado aqui.

## Execução local (após enviar os arquivos)
```sh
python -m http.server 8000
```
Acesse http://localhost:8000/. Requer internet para Babylon.js via CDN.

## Controles do protótipo
WASD movimentação · Shift corrida · botão direito aproxima câmera · botão esquerdo ataque · R reiniciar · Esc liberar mouse

## Próximas tarefas
- Integrar e testar os modelos GLB no navegador.
- Validar animações de corrida, caminhada, ataque e morte.
- Aperfeiçoar câmera híbrida, colisões e inteligência artificial.
- Implementar mapas e combate em etapas.

> O MAPONTES FPS antigo não é modificado por este projeto.
