import openai
import os
import json
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

api_key = os.getenv("EXPO_PUBLIC_DEEPSEEK_API_KEY") or os.getenv("DEEPSEEK_API_KEY")

if not api_key:
    print("ERRO: DEEPSEEK_API_KEY não encontrada.")
    exit(1)

client = openai.OpenAI(
    api_key=api_key,
    base_url="https://api.deepseek.com"
)

def prepare_finetune_data(input_file):
    """
    Converte o dataset base para o formato JSONL esperado pelo DeepSeek/OpenAI
    """
    output_file = input_file.replace('.json', '.jsonl')
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    with open(output_file, 'w', encoding='utf-8') as f:
        for entry in data:
            jsonl_entry = {
                "messages": [
                    {"role": "system", "content": "Você é um assistente veterinário especialista."},
                    {"role": "user", "content": f"{entry['instruction']} Contexto: {entry.get('context', 'N/A')}"},
                    {"role": "assistant", "content": entry['response']}
                ]
            }
            f.write(json.dumps(jsonl_entry, ensure_ascii=False) + '\n')
    
    print(f"Arquivo gerado: {output_file}")
    return output_file

def main():
    print("--- Script de Fine-tuning DeepSeek ---")
    dataset_path = 'training/veterinary_dataset.json'
    
    if os.path.exists(dataset_path):
        jsonl_path = prepare_finetune_data(dataset_path)
        
        print("\nPara DeepSeek, o fine-tuning geralmente é feito via painel ou")
        print("API de tuning específica se disponível no plano Enterprise.")
        print(f"Dataset pronto para upload: {jsonl_path}")
    else:
        print("Dataset base não encontrado.")

if __name__ == "__main__":
    main()
