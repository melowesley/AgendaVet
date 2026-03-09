import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configurar API
api_key = os.getenv("EXPO_PUBLIC_GEMINI_API_KEY") # Usando a mesma chave configurada no app
if not api_key:
    # Tentar nomes alternativos
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

if not api_key:
    print("ERRO: Chave de API do Gemini não encontrada.")
    exit(1)

genai.configure(api_key=api_key)

def prepare_tuning_data(dataset_path):
    """
    Prepara os dados para o formato aceito pelo Gemini Fine-tuning (JSONL)
    Note: O Gemini Fine-tuning geralmente requer uma estrutura específica.
    """
    with open(dataset_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Exemplo de conversão para o formato esperado (simplificado)
    # No mundo real, usaríamos a API de Tuning do Google
    print(f"Preparando {len(data)} exemplos para fine-tuning...")
    return data

def list_tuned_models():
    """Lista modelos que passaram por fine-tuning"""
    print("\nModelos ajustados disponíveis:")
    for model in genai.list_tuned_models():
        print(f"- {model.name}")

def main():
    dataset_path = 'training/veterinary_dataset.json'
    if not os.path.exists(dataset_path):
        print(f"Dataset não encontrado em {dataset_path}")
        return

    data = prepare_tuning_data(dataset_path)
    
    print("\n--- Script de Fine-tuning Gemini (Template) ---")
    print("Para realizar o fine-tuning real, é necessário usar o Google AI Studio")
    print("ou a API genai.create_tuned_model().")
    print("Este script serve como base para automação do pipeline.")
    
    # Exemplo de como seria o comando (requer permissões específicas e cota)
    # operation = genai.create_tuned_model(
    #     source_model='models/gemini-1.5-flash-001',
    #     training_data=data,
    #     id='agendavet-expert-v1'
    # )
    
    list_tuned_models()

if __name__ == "__main__":
    main()
