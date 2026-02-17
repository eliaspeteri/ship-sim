import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { SpaceModal } from '../../../../src/features/sim/SpaceModal';
import {
  getDefaultRules,
  RulesetType,
} from '../../../../src/types/rules.types';

const buildProps = (
  overrides?: Partial<React.ComponentProps<typeof SpaceModal>>,
) => ({
  isOpen: true,
  flow: 'choice' as const,
  spaces: [
    {
      id: 'alpha',
      name: 'Alpha Space',
      visibility: 'public',
      inviteToken: 'INVITE-123',
      rulesetType: 'CASUAL',
    },
  ],
  spacesLoading: false,
  spaceInput: 'alpha',
  setSpaceInput: jest.fn(),
  selectedSpaceRules: getDefaultRules(RulesetType.CASUAL),
  knownSpaces: [{ id: 'known-1', name: 'Known', visibility: 'public' }],
  inviteToken: 'INVITE-123',
  setInviteToken: jest.fn(),
  invitePassword: 'secret',
  setInvitePassword: jest.fn(),
  newSpaceName: 'My Space',
  setNewSpaceName: jest.fn(),
  newSpaceVisibility: 'public' as const,
  setNewSpaceVisibility: jest.fn(),
  newSpaceRulesetType: 'CASUAL',
  setNewSpaceRulesetType: jest.fn(),
  newSpacePassword: 'pw',
  setNewSpacePassword: jest.fn(),
  spaceError: null,
  setSpaceError: jest.fn(),
  onJoinSpace: jest.fn(),
  onFetchSpaces: jest.fn(),
  onCreateSpace: jest.fn(),
  onClose: jest.fn(),
  onFlowChange: jest.fn(),
  ...overrides,
});

describe('SpaceModal', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it('does not render when closed', () => {
    render(<SpaceModal {...buildProps({ isOpen: false })} />);

    expect(screen.queryByText('Choose a space')).not.toBeInTheDocument();
  });

  it('handles choice flow actions and overlay close', () => {
    const props = buildProps({ flow: 'choice' });
    const { container } = render(<SpaceModal {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Join space' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create space' }));

    expect(props.onFlowChange).toHaveBeenCalledWith('join');
    expect(props.onFlowChange).toHaveBeenCalledWith('create');
    expect(props.setSpaceError).toHaveBeenCalledWith(null);

    fireEvent.click(container.firstChild as HTMLElement);
    expect(props.onClose).toHaveBeenCalled();
    expect(props.onFlowChange).toHaveBeenCalledWith('choice');
  });

  it('handles join flow controls', () => {
    const props = buildProps({ flow: 'join', spaceError: 'Join error' });

    render(<SpaceModal {...props} />);

    fireEvent.change(screen.getByPlaceholderText('global'), {
      target: { value: 'beta' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    fireEvent.click(screen.getByRole('button', { name: /Alpha Space/i }));
    fireEvent.change(screen.getByPlaceholderText('Invite code'), {
      target: { value: 'NEW-INVITE' },
    });
    fireEvent.change(screen.getByPlaceholderText('Invite password'), {
      target: { value: 'pw-2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Use invite' }));

    expect(props.setSpaceInput).toHaveBeenCalledWith('beta');
    expect(props.onJoinSpace).toHaveBeenCalledWith('alpha');
    expect(props.setInviteToken).toHaveBeenCalledWith('NEW-INVITE');
    expect(props.setInvitePassword).toHaveBeenCalledWith('pw-2');
    expect(props.onFetchSpaces).toHaveBeenCalledWith({
      inviteToken: 'INVITE-123',
      password: 'secret',
    });
    expect(screen.getByText('Join error')).toBeInTheDocument();
  });

  it('renders join details card, copies invite token, and supports back/close', async () => {
    const props = buildProps({ flow: 'join' });

    render(<SpaceModal {...props} />);

    expect(screen.getByText(/Details for:/)).toBeInTheDocument();
    expect(screen.getByText('Known spaces: 1')).toBeInTheDocument();
    expect(screen.getByText('Stability')).toBeInTheDocument();
    expect(screen.getByText('COLREG')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy invite token' }));
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('INVITE-123');
    });
    expect(props.setSpaceError).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getAllByRole('button', { name: /^Back$/ })[0]);
    fireEvent.click(screen.getByRole('button', { name: /Close/ }));
    expect(props.onFlowChange).toHaveBeenCalledWith('choice');
    expect(props.onClose).toHaveBeenCalled();
  });

  it('handles copy invite token failure and empty join state', async () => {
    const clipboardError = jest
      .fn()
      .mockRejectedValue(new Error('clipboard unavailable'));
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardError },
      configurable: true,
    });
    const props = buildProps({
      flow: 'join',
      spaces: [],
      knownSpaces: [],
      selectedSpaceRules: null,
      spacesLoading: false,
    });
    const withInvite = buildProps({
      flow: 'join',
      setSpaceError: props.setSpaceError,
    });

    const { unmount } = render(<SpaceModal {...withInvite} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy invite token' }));
    await waitFor(() => {
      expect(props.setSpaceError).toHaveBeenCalledWith(
        'Failed to copy invite token',
      );
    });
    unmount();

    render(<SpaceModal {...props} />);
    expect(screen.getByText('No public spaces yet')).toBeInTheDocument();
    expect(screen.queryByText('Known spaces: 1')).not.toBeInTheDocument();
  });

  it('handles create flow controls', () => {
    const props = buildProps({ flow: 'create' });

    render(<SpaceModal {...props} />);

    fireEvent.change(screen.getByPlaceholderText('New space name'), {
      target: { value: 'New Alpha' },
    });
    const combos = screen.getAllByRole('combobox');
    fireEvent.change(combos[0], {
      target: { value: 'private' },
    });
    fireEvent.change(combos[1], {
      target: { value: 'REALISM' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password (optional)'), {
      target: { value: 'new-pass' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(props.setNewSpaceName).toHaveBeenCalledWith('New Alpha');
    expect(props.setNewSpaceVisibility).toHaveBeenCalledWith('private');
    expect(props.setNewSpaceRulesetType).toHaveBeenCalledWith('REALISM');
    expect(props.setNewSpacePassword).toHaveBeenCalledWith('new-pass');
    expect(props.onCreateSpace).toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole('button', { name: /^Back$/ })[1]);
    expect(props.onFlowChange).toHaveBeenCalledWith('choice');
  });
});
