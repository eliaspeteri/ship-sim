import React from 'react';
import { NextRouter } from 'next/router';
import socketManager from '../../../networking/socket';
import { getApiBase } from '../../../lib/api';
import {
  getDefaultRules,
  mapToRulesetType,
  Rules,
} from '../../../types/rules.types';
import { ChatMessageData } from '../../../types/socket.types';
import {
  DEFAULT_SPACE_ID,
  STORAGE_SPACE_KEY,
  STORAGE_SPACE_SELECTED_KEY,
} from '../constants';
import { SpaceFlow, SpaceSummary } from '../types';

type UseSpaceSelectionFlowParams = {
  router: NextRouter;
  spaceId: string;
  setSpaceId: (spaceId: string) => void;
  setChatMessages: (messages: ChatMessageData[]) => void;
};

type FetchSpacesOptions = {
  inviteToken?: string;
  password?: string;
};

type UseSpaceSelectionFlowResult = {
  spaceInput: string;
  setSpaceInput: React.Dispatch<React.SetStateAction<string>>;
  spaces: SpaceSummary[];
  spacesLoading: boolean;
  spaceError: string | null;
  setSpaceError: React.Dispatch<React.SetStateAction<string | null>>;
  inviteToken: string;
  setInviteToken: React.Dispatch<React.SetStateAction<string>>;
  invitePassword: string;
  setInvitePassword: React.Dispatch<React.SetStateAction<string>>;
  newSpaceName: string;
  setNewSpaceName: React.Dispatch<React.SetStateAction<string>>;
  newSpaceVisibility: 'public' | 'private';
  setNewSpaceVisibility: React.Dispatch<
    React.SetStateAction<'public' | 'private'>
  >;
  newSpaceRulesetType: string;
  setNewSpaceRulesetType: React.Dispatch<React.SetStateAction<string>>;
  newSpacePassword: string;
  setNewSpacePassword: React.Dispatch<React.SetStateAction<string>>;
  spaceModalOpen: boolean;
  setSpaceModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  hasChosenSpace: boolean;
  spaceSelectionHydrated: boolean;
  knownSpaces: SpaceSummary[];
  selectedSpaceRules: Rules | null;
  spaceFlow: SpaceFlow;
  setSpaceFlow: React.Dispatch<React.SetStateAction<SpaceFlow>>;
  joinSpace: (spaceId: string) => void;
  fetchSpaces: (options?: FetchSpacesOptions) => Promise<void>;
  createSpace: () => Promise<void>;
};

export function useSpaceSelectionFlow({
  router,
  spaceId,
  setSpaceId,
  setChatMessages,
}: UseSpaceSelectionFlowParams): UseSpaceSelectionFlowResult {
  const [spaceInput, setSpaceInput] = React.useState(
    spaceId || DEFAULT_SPACE_ID,
  );
  const [spaces, setSpaces] = React.useState<SpaceSummary[]>([]);
  const [spacesLoading, setSpacesLoading] = React.useState(false);
  const [spaceError, setSpaceError] = React.useState<string | null>(null);
  const [inviteToken, setInviteToken] = React.useState('');
  const [invitePassword, setInvitePassword] = React.useState('');
  const [newSpaceName, setNewSpaceName] = React.useState('');
  const [newSpaceVisibility, setNewSpaceVisibility] = React.useState<
    'public' | 'private'
  >('public');
  const [newSpaceRulesetType, setNewSpaceRulesetType] =
    React.useState('CASUAL');
  const [newSpacePassword, setNewSpacePassword] = React.useState('');
  const [spaceModalOpen, setSpaceModalOpen] = React.useState(false);
  const [hasChosenSpace, setHasChosenSpace] = React.useState(false);
  const [spaceSelectionHydrated, setSpaceSelectionHydrated] =
    React.useState(false);
  const [knownSpaces, setKnownSpaces] = React.useState<SpaceSummary[]>([]);
  const [spaceFlow, setSpaceFlow] = React.useState<SpaceFlow>('choice');

  const selectedSpace = React.useMemo(
    () => spaces.find(space => space.id === spaceInput),
    [spaceInput, spaces],
  );

  const selectedSpaceRules = React.useMemo(() => {
    if (!selectedSpace) return null;
    if (selectedSpace.rules) return selectedSpace.rules;
    const type = mapToRulesetType(selectedSpace.rulesetType || 'CASUAL');
    return getDefaultRules(type);
  }, [selectedSpace]);

  const mergeSpaceLists = React.useCallback(
    (prev: SpaceSummary[], incoming: SpaceSummary[]): SpaceSummary[] => {
      const merged = new Map<string, SpaceSummary>();
      [...prev, ...incoming].forEach(space => {
        merged.set(space.id, {
          ...space,
          visibility: space.visibility || 'public',
        });
      });
      return Array.from(merged.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    },
    [],
  );

  const mergeSpaces = React.useCallback(
    (incoming: SpaceSummary[]) => {
      setSpaces(prev => mergeSpaceLists(prev, incoming));
    },
    [mergeSpaceLists],
  );

  const saveKnownSpace = React.useCallback(
    async (nextSpaceId: string, nextInviteToken?: string) => {
      try {
        const apiBase = getApiBase();
        await fetch(`${apiBase}/api/spaces/known`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            spaceId: nextSpaceId,
            inviteToken: nextInviteToken,
          }),
        });
      } catch (error) {
        console.warn('Failed to save known space', error);
      }
    },
    [],
  );

  const joinSpace = React.useCallback(
    (nextSpaceId: string) => {
      const normalized = nextSpaceId.trim().toLowerCase() || DEFAULT_SPACE_ID;
      setSpaceInput(normalized);
      setSpaceId(normalized);
      setChatMessages([]);
      socketManager.switchSpace(normalized);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_SPACE_KEY, normalized);
        window.localStorage.setItem(STORAGE_SPACE_SELECTED_KEY, 'true');
      }
      setHasChosenSpace(true);
      setSpaceModalOpen(false);
      setSpaceFlow('choice');
      void router.replace(
        {
          pathname: router.pathname,
          query: { ...router.query, space: normalized },
        },
        undefined,
        { shallow: true },
      );
    },
    [router, setChatMessages, setSpaceId],
  );

  const fetchSpaces = React.useCallback(
    async (options?: FetchSpacesOptions) => {
      setSpacesLoading(true);
      setSpaceError(null);
      try {
        const apiBase = getApiBase();
        const params = new URLSearchParams();
        if (options?.inviteToken) {
          params.set('inviteToken', options.inviteToken.trim());
        }
        if (options?.password) {
          params.set('password', options.password);
        }
        params.set('includeKnown', 'true');
        const qs = params.toString();
        const response = await fetch(
          `${apiBase}/api/spaces${qs ? `?${qs}` : ''}`,
          { credentials: 'include' },
        );
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        const incoming = Array.isArray(data?.spaces)
          ? (data.spaces as SpaceSummary[])
          : [];
        mergeSpaces(incoming);
        setKnownSpaces(prev => mergeSpaceLists(prev, incoming));
        if (options?.inviteToken && incoming.length > 0) {
          await Promise.all(
            incoming.map(space =>
              saveKnownSpace(
                space.id,
                space.inviteToken || options.inviteToken,
              ),
            ),
          );
          setSpaceInput(incoming[0].id);
        }
      } catch (error) {
        console.error('Failed to load spaces', error);
        setSpaceError('Failed to load spaces. Check invite or try again.');
      } finally {
        setSpacesLoading(false);
      }
    },
    [mergeSpaceLists, mergeSpaces, saveKnownSpace],
  );

  const createSpace = React.useCallback(async () => {
    const name = newSpaceName.trim();
    if (!name) {
      setSpaceError('Space name is required');
      return;
    }

    const creatingPublicDuplicate =
      newSpaceVisibility === 'public' &&
      spaces.some(
        space =>
          space.visibility === 'public' &&
          space.name.toLowerCase() === name.toLowerCase(),
      );

    if (creatingPublicDuplicate) {
      setSpaceError('A public space with that name already exists');
      return;
    }

    setSpaceError(null);

    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/spaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          visibility: newSpaceVisibility,
          rulesetType: newSpaceRulesetType,
          password: newSpacePassword || undefined,
        }),
        credentials: 'include',
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        const message =
          body.error || `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      const created = (await response.json()) as SpaceSummary;
      mergeSpaces([created]);
      setKnownSpaces(prev => mergeSpaceLists(prev, [created]));
      setNewSpaceName('');
      setNewSpaceRulesetType('CASUAL');
      setNewSpacePassword('');
      void saveKnownSpace(created.id, created.inviteToken);
      joinSpace(created.id);
    } catch (error) {
      console.error('Failed to create space', error);
      setSpaceError('Failed to create space');
    }
  }, [
    joinSpace,
    mergeSpaceLists,
    mergeSpaces,
    newSpaceName,
    newSpacePassword,
    newSpaceRulesetType,
    newSpaceVisibility,
    saveKnownSpace,
    spaces,
  ]);

  React.useEffect(() => {
    setSpaceInput(spaceId || DEFAULT_SPACE_ID);
  }, [spaceId]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedSpace = window.localStorage.getItem(STORAGE_SPACE_KEY);
    const savedSelected = window.localStorage.getItem(
      STORAGE_SPACE_SELECTED_KEY,
    );

    if (savedSpace) {
      setSpaceId(savedSpace);
      setSpaceInput(savedSpace);
      setHasChosenSpace(true);
    } else if (!savedSelected) {
      setSpaceModalOpen(true);
      setSpaceFlow('choice');
    }

    setSpaceSelectionHydrated(true);
  }, [setSpaceId]);

  React.useEffect(() => {
    const querySpace =
      typeof router.query.space === 'string'
        ? router.query.space.trim().toLowerCase()
        : null;

    if (querySpace && querySpace !== spaceId) {
      setSpaceId(querySpace);
      socketManager.switchSpace(querySpace);
      setChatMessages([]);
      setHasChosenSpace(true);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_SPACE_KEY, querySpace);
        window.localStorage.setItem(STORAGE_SPACE_SELECTED_KEY, 'true');
      }
    }
  }, [router.query.space, setChatMessages, setSpaceId, spaceId]);

  React.useEffect(() => {
    void fetchSpaces();
  }, [fetchSpaces]);

  return {
    spaceInput,
    setSpaceInput,
    spaces,
    spacesLoading,
    spaceError,
    setSpaceError,
    inviteToken,
    setInviteToken,
    invitePassword,
    setInvitePassword,
    newSpaceName,
    setNewSpaceName,
    newSpaceVisibility,
    setNewSpaceVisibility,
    newSpaceRulesetType,
    setNewSpaceRulesetType,
    newSpacePassword,
    setNewSpacePassword,
    spaceModalOpen,
    setSpaceModalOpen,
    hasChosenSpace,
    spaceSelectionHydrated,
    knownSpaces,
    selectedSpaceRules,
    spaceFlow,
    setSpaceFlow,
    joinSpace,
    fetchSpaces,
    createSpace,
  };
}
