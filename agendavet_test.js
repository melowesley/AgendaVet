// AgendaVet - Teste de Componente de Lembrete
// Este arquivo serve para testar a interatividade remota.

const agendamentos = [
    { id: 1, pet: "Rex", tutor: "Wesley", hora: "10:00" },
    { id: 2, pet: "Thor", tutor: "João", hora: "11:30" }
];

function listarAgendamentos(lista) {
    console.log("--- Agendamentos do Dia ---");
    lista.forEach(item => {
        console.log(`Pet: ${item.pet} | Hora: ${item.hora}`);
    });
    console.log(`Total de ${lista.length} pacientes.`);
    return lista.length;
}

// Chamar a função
listarAgendamentos(agendamentos);
