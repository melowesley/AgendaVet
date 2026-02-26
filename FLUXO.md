# Fluxo Completo — AgendaVet

Este documento descreve o fluxo de uso do sistema, desde o login do tutor até o atendimento pelo veterinário.

---

## Visão Geral do Fluxo

```
Tutor (Portal do Cliente)                    Veterinário (Portal Admin)
        │                                              │
        ▼                                              │
   [Login / Cadastro]                                   │
        │                                              │
        ▼                                              │
   [Cadastrar Pet]                                     │
        │                                              │
        ▼                                              │
   [Agendar Consulta] ──────────────────────────────► │
        │                    (status: pending)         │
        │                                              ▼
        │                                    [Agenda do Veterinário]
        │                                              │
        │                                              ▼
        │                                    [Confirmar Agendamento]
        │                                    (scheduled_date, scheduled_time)
        │                                              │
        │                                              ▼
        │                                    [Clicar no Paciente]
        │                                              │
        │                                              ├──► [Abrir Ficha] → Histórico completo
        │                                              │
        │                                              └──► [Iniciar Atendimento]
        │                                                          │
        │                                                          ▼
        │                                              [Módulos: Consulta, Vacina, etc.]
        │                                                          │
        │                                              [Concluir] (status: completed)
        ▼                                              ▼
   [Ver solicitações]                          [Próximo paciente]
```

---

## 1. Login na Página do Tutor

- **Rota:** `/auth`
- **Ações:**
  - **Entrar:** email + senha
  - **Cadastrar:** nome, telefone, endereço, email, senha
- Ao fazer login, o tutor é redirecionado para `/cliente` (Portal do Cliente).
- Novos usuários recebem automaticamente a role `user` (tutor).

---

## 2. Cadastrar Pet (Portal do Tutor)

- **Rota:** `/cliente`
- **Ação:** Botão "Adicionar Pet" ou "Cadastrar Pet"
- **Campos:** Nome, Tipo (Cachorro/Gato), Raça, Idade, Peso, Observações
- O pet fica salvo na página do tutor e aparece na lista "Meus Pets".

---

## 3. Agendar Consulta (Tutor)

- **Onde:** Na página do tutor (`/cliente`), em cada card de pet há o botão "Agendar Consulta".
- **Ação:** Clicar em "Agendar Consulta" em um pet.
- **Campos:**
  - Pet (pré-selecionado ou escolhido na lista)
  - Data preferida
  - Horário preferido
  - Motivo (Consulta de rotina, Vacinação, Emergência, etc.)
  - Observações
- **Resultado:** Cria um registro em `appointment_requests` com `status = 'pending'`.
- A solicitação aparece na seção "Minhas Solicitações" do tutor.

---

## 4. Agendamento na Agenda do Veterinário

- **Rota:** `/admin` → aba **Calendário** (ou **Agenda de Consultas**)
- O agendamento criado pelo tutor **já aparece** na agenda do veterinário.
- Enquanto `status = 'pending'`, usa `preferred_date` e `preferred_time`.
- O admin/veterinário pode:
  - **Confirmar:** define `scheduled_date`, `scheduled_time`, `veterinário` e muda status para `confirmed`
  - **Cancelar:** muda status para `cancelled`

---

## 5. Veterinário Clica no Paciente

- Na agenda (visão Semana ou Mês), cada consulta aparece como um card.
- Ao clicar no nome do paciente ou em "Ver detalhes", abre o **CalendarAppointmentDetail**.
- Duas opções:
  1. **Abrir Ficha do Paciente:** navega para `/admin/pet/:petId` — ficha completa com histórico (timeline).
  2. **Iniciar Atendimento:** abre o menu de módulos (Consulta, Vacina, Exame, etc.).

---

## 6. Ficha do Paciente (Histórico)

- **Rota:** `/admin/pet/:petId`
- Exibe:
  - Dados do pet e do tutor
  - **Timeline unificada:** consultas, vacinas, exames, peso, receitas, etc.
  - Botão "Atendimento Clínico" para abrir os módulos
- O veterinário pode registrar novos procedimentos a partir da ficha.

---

## 7. Iniciar Atendimento

- Ao clicar em "Iniciar Atendimento" (na agenda ou na ficha), abre o **AttendanceTypeDialog**.
- O veterinário escolhe o tipo de procedimento:
  - **Consulta, Cirurgia, Retorno, Avaliação Cirúrgica:** cria `appointment_requests` com status `confirmed` e abre o módulo correspondente.
  - **Peso, Vacina, Exame, etc.:** abre diretamente o módulo com `petId` e `petName`.
- Cada módulo salva na tabela específica e registra em `pet_admin_history` para a timeline.

---

## 8. Estados do Agendamento

| Status            | Descrição                          |
|-------------------|------------------------------------|
| `pending`         | Tutor solicitou — aguarda confirmação |
| `confirmed`       | Admin confirmou data/hora          |
| `reminder_sent`   | Lembrete enviado                    |
| `checked_in`      | Cliente chegou à clínica            |
| `in_progress`     | Veterinário iniciou atendimento     |
| `completed`       | Atendimento concluído               |
| `return_scheduled`| Retorno agendado                    |
| `cancelled`       | Cancelado                           |
| `no_show`         | Não compareceu                      |

---

## 9. Políticas e Segurança (RLS)

- **Tutores:** podem ver e gerenciar apenas seus próprios pets e solicitações.
- **Admins/Veterinários:** podem ver e gerenciar todos os registros.
- Ao criar uma solicitação de consulta, o sistema valida que o pet pertence ao tutor.

---

## 10. Resumo Rápido

1. Tutor faz login em `/auth` e acessa `/cliente`.
2. Tutor cadastra pet(s) na página.
3. Tutor agenda consulta para um pet → status `pending`.
4. Agendamento aparece na agenda do veterinário em `/admin` → Calendário.
5. Veterinário confirma (define data/hora) ou cancela.
6. Veterinário clica no paciente → pode **Abrir Ficha** (histórico) ou **Iniciar Atendimento**.
7. Atendimento é registrado nos módulos e aparece na timeline da ficha do pet.
