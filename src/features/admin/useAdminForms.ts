import { useState } from 'react';

export function useAdminForms() {
  const [banForm, setBanForm] = useState({
    userId: '',
    username: '',
    reason: '',
    expiresAt: '',
  });
  const [muteForm, setMuteForm] = useState({
    userId: '',
    username: '',
    reason: '',
    expiresAt: '',
  });
  const [kickForm, setKickForm] = useState({ userId: '', reason: '' });
  const [kickMessage, setKickMessage] = useState<string | null>(null);
  const [roleUserId, setRoleUserId] = useState('');
  const [roleValue, setRoleValue] = useState('player');
  const [roleMessage, setRoleMessage] = useState<string | null>(null);
  const [moveForm, setMoveForm] = useState({
    vesselId: '',
    lat: '',
    lon: '',
  });
  const [moveMessage, setMoveMessage] = useState<string | null>(null);

  return {
    banForm,
    setBanForm,
    muteForm,
    setMuteForm,
    kickForm,
    setKickForm,
    kickMessage,
    setKickMessage,
    roleUserId,
    setRoleUserId,
    roleValue,
    setRoleValue,
    roleMessage,
    setRoleMessage,
    moveForm,
    setMoveForm,
    moveMessage,
    setMoveMessage,
  };
}
