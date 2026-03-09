import json
import re

def calculate_accuracy(expected, actual):
    """
    Simulação simples de acurácia baseada em palavras-chave médicas.
    Em um cenário real, usaríamos BERTScore ou avaliação humana.
    """
    # Exemplo de palavras-chave críticas
    keywords = ["veterinário", "consulta", "exames", "dose", "diagnóstico"]
    found = [kw for kw in keywords if kw.lower() in str(actual).lower()]
    return len(found) / len(keywords)

def run_evaluation(model_name, test_cases):
    """
    Avalia um modelo contra uma lista de casos de teste.
    """
    print(f"\n--- Avaliando Modelo: {model_name} ---")
    results = []
    
    for _ in test_cases:
        # Aqui integraríamos com a chamada real da API
        # score = calculate_accuracy(case['expected'], model_response)
        score: float = 0.85 # Mock para demonstração
        results.append(score)
        
    avg_score = sum(results) / len(results)
    print(f"Média de Acurácia: {avg_score:.2%}")
    return avg_score

if __name__ == "__main__":
    test_cases = [
        {"input": "Quais os sintomas de raiva em gatos?", "expected": "Salivação, agressividade, paralisia"}
    ]
    run_evaluation("DeepSeek-V3-Vet", test_cases)
