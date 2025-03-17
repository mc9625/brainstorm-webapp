#!/bin/bash
# Script per avviare il servizio AI con l'ambiente virtuale attivato

# Vai alla directory del progetto
cd /Users/massimo/Developer/brainstorm-website/brainstorm

# Attiva l'ambiente virtuale
source venv/bin/activate

# Esegui lo script Python con i parametri
python3 main.py --server ita

# Non è necessario disattivare l'ambiente poiché lo script rimarrà in esecuzione
