import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { TournamentView, StageType, UserProfile } from '../backend';

export function useGetAllTournaments() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[bigint, TournamentView]>>({
    queryKey: ['tournaments'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTournaments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTournament(id: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<TournamentView | null>({
    queryKey: ['tournament', id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getTournament(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateTournament() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: bigint; name: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.createTournament(id, name);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}

export function useUpdateTournamentName() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newName }: { id: bigint; newName: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateTournamentName(id, newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}

export function useAddGroupToTournament() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tournamentId, groupId, groupName }: { tournamentId: bigint; groupId: bigint; groupName: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addGroupToTournament(tournamentId, groupId, groupName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}

export function useAddStageToTournament() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tournamentId, stageId, name, stageType }: { tournamentId: bigint; stageId: bigint; name: string; stageType: StageType }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addStageToTournament(tournamentId, stageId, name, stageType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}

export function useDeleteTournament() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteTournament(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSetProfilePrivacy() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isPrivate: boolean) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.setProfilePrivacy(isPrivate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUpdateUsername() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newUsername: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.updateUsername(newUsername);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}
