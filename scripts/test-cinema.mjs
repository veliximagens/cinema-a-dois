// scripts/test-cinema.mjs
async function runTests() {
  const BASE_URL = 'http://localhost:3000';
  console.log('--- INICIANDO BATERIA DE TESTES CINEMA A DOIS ---');

  // Test 1: Healthcheck & Sala Principal
  console.log('\n[TESTE 1] Verificando Sala Principal e Hub de Sinalização...');
  const resRooms = await fetch(`${BASE_URL}/api/signaling/rooms?id=geral`);
  const roomsData = await resRooms.json();
  if (!roomsData.room || roomsData.room.id !== 'geral') {
    throw new Error('Falha ao recuperar Sala Principal.');
  }
  console.log('✅ Sala Principal ativa:', roomsData.room.name);

  // Test 2: Criar sala privada com anfitrião
  console.log('\n[TESTE 2] Criando sala privada para casal/amigos...');
  const roomId = `cinema-${Date.now().toString(36)}`;
  const hostId = `host-${Date.now().toString(36)}`;
  const resCreate = await fetch(`${BASE_URL}/api/signaling/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: roomId,
      name: 'Noite de Cinema Especial ❤️',
      isPrivate: true,
      maxParticipants: 2,
      createdBy: hostId,
      createdByName: 'Meu Par',
    }),
  });
  const createData = await resCreate.json();
  if (!createData.success || !createData.room) {
    throw new Error(`Falha ao criar sala privada: ${JSON.stringify(createData)}`);
  }
  console.log('✅ Sala privada criada com sucesso:', createData.room.id, createData.room.name);

  // Test 3: Gerar convite exclusivo com validade e limite de usos
  console.log('\n[TESTE 3] Gerando convite exclusivo com token...');
  const resInvite = await fetch(`${BASE_URL}/api/signaling/invites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId,
      createdBy: hostId,
      createdByName: 'Meu Par',
      expiresInHours: 24,
      maxUses: 2,
    }),
  });
  const inviteData = await resInvite.json();
  if (!inviteData.success || !inviteData.invite?.token) {
    throw new Error(`Falha ao gerar convite: ${JSON.stringify(inviteData)}`);
  }
  const token = inviteData.invite.token;
  console.log('✅ Convite gerado com sucesso! Token:', token);

  // Test 4: Validar convite gerado
  console.log('\n[TESTE 4] Validando convite recém-criado...');
  const resVal = await fetch(`${BASE_URL}/api/signaling/invites?roomId=${roomId}&token=${token}`);
  const valData = await resVal.json();
  if (!valData.valid) {
    throw new Error(`Convite deveria ser válido, mas falhou: ${valData.reason}`);
  }
  console.log('✅ Convite validado no backend:', valData.invite.token, 'Usos:', valData.invite.usesCount);

  // Test 5: Acesso sem convite em sala privada (Deve ser BLOQUEADO)
  console.log('\n[TESTE 5] Testando proteção de sala privada (tentativa sem convite)...');
  const resNoInvite = await fetch(`${BASE_URL}/api/signaling/rooms/access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId,
      peerId: 'intruso-sem-convite',
    }),
  });
  const noInviteData = await resNoInvite.json();
  if (noInviteData.allowed) {
    throw new Error('Falha de segurança: usuário sem convite conseguiu autorização em sala privada!');
  }
  console.log('✅ Proteção confirmada: Acesso bloqueado corretamente:', noInviteData.reason);

  // Test 6: Acesso com convite válido (Deve ser LIBERADO e incrementar uso)
  console.log('\n[TESTE 6] Entrando na sala através do convite exclusivo...');
  const resWithInvite = await fetch(`${BASE_URL}/api/signaling/rooms/access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId,
      peerId: 'convidado-amor',
      token,
    }),
  });
  const withInviteData = await resWithInvite.json();
  if (!withInviteData.allowed) {
    throw new Error(`Falha ao autorizar convite válido: ${withInviteData.reason}`);
  }
  console.log('✅ Entrada autorizada com sucesso na sala:', withInviteData.room?.name);

  // Test 7: Revogar convite
  console.log('\n[TESTE 7] Anfitrião revogando o convite...');
  const resRevoke = await fetch(`${BASE_URL}/api/signaling/invites`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId,
      token,
      peerId: hostId,
    }),
  });
  const revokeData = await resRevoke.json();
  if (!revokeData.success) {
    throw new Error(`Falha ao revogar convite: ${JSON.stringify(revokeData)}`);
  }
  console.log('✅ Convite revogado com sucesso pelo anfitrião.');

  // Test 8: Tentar usar convite revogado (Deve falhar)
  console.log('\n[TESTE 8] Tentando acessar com o convite que foi revogado...');
  const resAfterRevoke = await fetch(`${BASE_URL}/api/signaling/rooms/access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomId,
      peerId: 'outro-convidado',
      token,
    }),
  });
  const afterRevokeData = await resAfterRevoke.json();
  if (afterRevokeData.allowed) {
    throw new Error('Falha de segurança: convite revogado ainda permitiu acesso!');
  }
  console.log('✅ Convite revogado recusado corretamente:', afterRevokeData.reason);

  // Test 9: Envio de sinais de chat e áudio (WebRTC signaling)
  console.log('\n[TESTE 9] Testando envio de sinais de áudio e chat...');
  const resMsg = await fetch(`${BASE_URL}/api/signaling/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'chat',
      roomId,
      senderId: hostId,
      payload: {
        message: {
          id: `msg-${Date.now()}`,
          roomId,
          senderId: hostId,
          senderName: 'Meu Par',
          senderAvatar: '❤️',
          senderColor: '#E11D48',
          text: 'Pipoca pronta! Vamos começar o filme 🍿❤️',
          timestamp: Date.now(),
        },
      },
      timestamp: Date.now(),
    }),
  });
  const msgData = await resMsg.json();
  if (!msgData.success) {
    throw new Error(`Falha ao despachar mensagem de sinalização: ${JSON.stringify(msgData)}`);
  }
  console.log('✅ Mensagem de sinalização e sincronismo enviada com sucesso.');

  console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO! 🎉\n');
}

runTests().catch((err) => {
  console.error('❌ ERRO NO TESTE:', err);
  process.exit(1);
});
