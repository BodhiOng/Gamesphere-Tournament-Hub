import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TeamRoster from '../../components/TeamRoster/TeamRoster';
import {
  addTeamMember,
  approveTeamJoinRequest,
  assignTeamCaptain,
  cancelTeamJoinRequest,
  createTeam,
  deleteTeam,
  discoverTeams,
  getMyTeams,
  getTeamJoinRequests,
  getTeamRoster,
  leaveTeam,
  rejectTeamJoinRequest,
  removeTeamMember,
  renameTeam,
  requestTeamJoin,
  updateTeamProfile,
} from '../../api/teamApi';
import { uploadImage } from '../../api/mediaApi';
import { useAuth } from '../../context/AuthContext';

function TeamManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [members, setMembers] = useState([]);
  const [enlistedSearch, setEnlistedSearch] = useState('');
  const [enlistedPage, setEnlistedPage] = useState(0);
  const ENLISTED_COLS = 3;
  const DISCOVER_PAGE_SIZE = 8;
  const DISCOVER_VISIBLE_GAMES = 3;
  const DISCOVER_ROSTER_PAGE_SIZE = 5;
  const DISCOVER_TOURNAMENT_PAGE_SIZE = 5;
  const JOIN_REQUESTS_PAGE_SIZE = 10;
  const [myTeams, setMyTeams] = useState([]);
  const [teamsView, setTeamsView] = useState('my');
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [selectedDiscoverTeam, setSelectedDiscoverTeam] = useState(null);
  const [profileLogoBroken, setProfileLogoBroken] = useState(false);
  const [discoverLogoBroken, setDiscoverLogoBroken] = useState(false);
  const [discoverFeed, setDiscoverFeed] = useState([]);
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [discoverPage, setDiscoverPage] = useState(0);
  const [discoverRosterPage, setDiscoverRosterPage] = useState(0);
  const [discoverTournamentPage, setDiscoverTournamentPage] = useState(0);
  const [discoverTournamentFilter, setDiscoverTournamentFilter] = useState('ongoing');
  const [canRequestJoin, setCanRequestJoin] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [joinRequestSearch, setJoinRequestSearch] = useState('');
  const [joinRequestPage, setJoinRequestPage] = useState(1);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [myTeamsLoaded, setMyTeamsLoaded] = useState(false);
  const [discoverLoaded, setDiscoverLoaded] = useState(false);
  const [hasInitializedTeamsView, setHasInitializedTeamsView] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamInfo, setTeamInfo] = useState({
    teamId: null,
    teamPublicId: '',
    teamName: '',
    teamLogoUrl: '',
    teamDescription: '',
    memberLimit: null,
    memberCount: 0,
    preferredGames: [],
    enlistedTournaments: [],
    captainUserId: null,
  });
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [memberLimitInput, setMemberLimitInput] = useState('');
  const [memberLimitError, setMemberLimitError] = useState('');
  const [description, setDescription] = useState('');
  const [preferredGamesInput, setPreferredGamesInput] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState('');
  const [memberUsername, setMemberUsername] = useState('');
  const [memberInputInvalid, setMemberInputInvalid] = useState(false);
  const [logoUrlError, setLogoUrlError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [preferredGamesError, setPreferredGamesError] = useState('');
  const [createTeamError, setCreateTeamError] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [savingAction, setSavingAction] = useState('');
  const [logoUploadBusy, setLogoUploadBusy] = useState(false);
  const noticeTimerRef = useRef(null);
  const { user, updateUser } = useAuth();

  const hasTeams = myTeams.length > 0;
  const sortedMyTeams = useMemo(() => {
    return [...myTeams].sort((left, right) => {
      const leftCaptain = Boolean(left?.isCaptain);
      const rightCaptain = Boolean(right?.isCaptain);

      if (leftCaptain !== rightCaptain) {
        return leftCaptain ? -1 : 1;
      }

      return String(left?.name || '').localeCompare(String(right?.name || ''));
    });
  }, [myTeams]);
  const teamLabel = useMemo(() => teamInfo.teamName || user?.teamName || user?.team || user?.currentTeam || '', [teamInfo.teamName, user]);
  const isAssigned = hasTeams;
  const showDiscoverPanel = teamsView === 'discover';
  const showMyTeamsPanel = teamsView === 'my';
  const isCaptain = Boolean(user?.id && teamInfo.captainUserId === user.id);
  const activeTeamId = teamInfo.teamId ?? selectedTeamId ?? null;
  const activeTeamPublicId = useMemo(() => {
    if (teamInfo.teamPublicId) return teamInfo.teamPublicId;
    if (activeTeamId == null) return '';
    return myTeams.find((team) => team.id === activeTeamId)?.publicId || '';
  }, [teamInfo.teamPublicId, activeTeamId, myTeams]);
  const activeDiscoverTeam = useMemo(() => {
    if (!selectedDiscoverTeam) {
      return null;
    }

    return discoverFeed.find((team) => team.id === selectedDiscoverTeam.id) || selectedDiscoverTeam;
  }, [discoverFeed, selectedDiscoverTeam]);

  useEffect(() => {
    const viewParam = String(searchParams.get('view') || '').trim().toLowerCase();
    const teamIdParam = Number(searchParams.get('teamId'));

    if (viewParam === 'discover') {
      setTeamsView('discover');
    }

    if (Number.isFinite(teamIdParam) && teamIdParam > 0) {
      const matchingTeam = discoverFeed.find((team) => team.id === teamIdParam);
      if (matchingTeam) {
        setSelectedDiscoverTeam(matchingTeam);
        setTeamsView('discover');
      }
    }
  }, [searchParams, discoverFeed]);

  const clearNotice = () => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
    setNotice('');
  };

  const showNotice = (message) => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }

    setNotice(message);
    if (message) {
      noticeTimerRef.current = window.setTimeout(() => {
        setNotice('');
        noticeTimerRef.current = null;
      }, 10000);
    }
  };

  useEffect(() => () => {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!user || !myTeamsLoaded || hasInitializedTeamsView) {
      return;
    }

    if (hasTeams && teamsView !== 'my') {
      setTeamsView('my');
      setHasInitializedTeamsView(true);
      return;
    }

    if (!hasTeams && teamsView === 'my') {
      setTeamsView('discover');
      setHasInitializedTeamsView(true);
    }
  }, [user, hasTeams, myTeamsLoaded, hasInitializedTeamsView, teamsView]);

  useEffect(() => {
    if (!isAssigned) {
      setRenameValue('');
      return;
    }

    setRenameValue(teamLabel);
  }, [isAssigned, teamLabel]);

  useEffect(() => {
    if (!isAssigned) {
      setLogoUrl('');
      setLogoFile(null);
      setDescription('');
      setMemberLimitInput('');
      setMemberLimitError('');
      setPreferredGamesInput('');
      setProfileLogoBroken(false);
      return;
    }

    setLogoUrl(teamInfo.teamLogoUrl || '');
    setDescription(teamInfo.teamDescription || '');
    setMemberLimitInput(teamInfo.memberLimit != null ? String(teamInfo.memberLimit) : '');
    setPreferredGamesInput(Array.isArray(teamInfo.preferredGames) ? teamInfo.preferredGames.join(', ') : '');
  }, [isAssigned, teamInfo.teamLogoUrl, teamInfo.teamDescription, teamInfo.memberLimit, teamInfo.preferredGames]);

  useEffect(() => {
    if (memberLimitInput === '') {
      setMemberLimitError('');
      return;
    }

    const parsedLimit = Number(memberLimitInput);
    if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
      setMemberLimitError('Enter a valid member limit.');
      return;
    }

    if (teamInfo.memberCount > parsedLimit) {
      setMemberLimitError(`Member limit must be at least ${teamInfo.memberCount}.`);
      return;
    }

    setMemberLimitError('');
  }, [memberLimitInput, teamInfo.memberCount]);

  useEffect(() => {
    setDiscoverLogoBroken(false);
  }, [activeDiscoverTeam?.id, activeDiscoverTeam?.logoUrl]);

  useEffect(() => {
    setDiscoverRosterPage(0);
    setDiscoverTournamentPage(0);
    setDiscoverTournamentFilter('ongoing');
  }, [activeDiscoverTeam?.id]);

  useEffect(() => {
    setDiscoverTournamentPage(0);
  }, [discoverTournamentFilter]);

  useEffect(() => {
    if (!user || !hasTeams) {
      setMembers([]);
      setTeamInfo({
        teamId: null,
        teamPublicId: '',
        teamName: '',
        teamLogoUrl: '',
        teamDescription: '',
        memberLimit: null,
        memberCount: 0,
        preferredGames: [],
        enlistedTournaments: [],
        captainUserId: null,
      });
      return;
    }

    let ignore = false;

    getTeamRoster(user, selectedTeamId)
      .then((result) => {
        if (!ignore) {
          setMembers(result.members || []);
          setTeamInfo({
            teamId: result.teamId,
            teamPublicId: result.teamPublicId || '',
            teamName: result.teamName,
            teamLogoUrl: result.teamLogoUrl || '',
            teamDescription: result.teamDescription || '',
            memberLimit: result.memberLimit ?? null,
            memberCount: result.memberCount ?? 0,
            preferredGames: Array.isArray(result.preferredGames) ? result.preferredGames : [],
            enlistedTournaments: Array.isArray(result.enlistedTournaments) ? result.enlistedTournaments : [],
            captainUserId: result.captainUserId,
          });
          setSelectedTeamId(result.teamId ?? null);
        }
      })
      .catch(() => {
        if (!ignore) {
          setMembers([]);
          setTeamInfo({
            teamId: null,
            teamPublicId: '',
            teamName: '',
            teamLogoUrl: '',
            teamDescription: '',
            memberLimit: null,
            memberCount: 0,
            preferredGames: [],
            enlistedTournaments: [],
            captainUserId: null,
          });
          setSelectedTeamId(null);
        }
      });

    return () => {
      ignore = true;
    };

  }, [user, hasTeams, selectedTeamId]);

  useEffect(() => {
    if (!user) {
      setMyTeams([]);
      setDiscoverFeed([]);
      setCanRequestJoin(false);
      setMyTeamsLoaded(false);
      setDiscoverLoaded(false);
      return;
    }

    let ignore = false;
    setMyTeamsLoaded(false);
    getMyTeams(user)
      .then((teams) => {
        if (!ignore) {
          setMyTeams(teams);
          setMyTeamsLoaded(true);
          if (teams.length === 0) {
            setTeamsView('discover');
              setHasInitializedTeamsView(true);
            setSelectedTeamId(null);
            return;
          }

          setTeamsView('my');
            setHasInitializedTeamsView(true);

          if (selectedTeamId != null && teams.some((team) => team.id === selectedTeamId)) {
            return;
          }

          const captainFirstTeam = [...teams].sort((left, right) => {
            const leftCaptain = Boolean(left?.isCaptain);
            const rightCaptain = Boolean(right?.isCaptain);

            if (leftCaptain !== rightCaptain) {
              return leftCaptain ? -1 : 1;
            }

            return String(left?.name || '').localeCompare(String(right?.name || ''));
          })[0];

          setSelectedTeamId(captainFirstTeam?.id ?? teams[0].id);
        }
      })
      .catch(() => {
        if (!ignore) {
          setMyTeams([]);
          setMyTeamsLoaded(true);
          setTeamsView('discover');
          setHasInitializedTeamsView(true);
        }
      });

    return () => {
      ignore = true;
    };
  }, [user, teamInfo.teamId, selectedTeamId]);

  useEffect(() => {
    if (!user) {
      setDiscoverFeed([]);
      setCanRequestJoin(false);
      setDiscoverLoaded(false);
      setHasInitializedTeamsView(false);
      return;
    }

    let ignore = false;
    setDiscoverLoaded(false);
    discoverTeams(user)
      .then((result) => {
        if (!ignore) {
          setDiscoverFeed(Array.isArray(result?.teams) ? result.teams : []);
          setCanRequestJoin(Boolean(result?.canRequestJoin));
          setDiscoverLoaded(true);
        }
      })
      .catch(() => {
        if (!ignore) {
          setDiscoverFeed([]);
          setCanRequestJoin(false);
          setDiscoverLoaded(true);
        }
      });

    return () => {
      ignore = true;
    };
  }, [user, myTeams.length, selectedTeamId]);

  useEffect(() => {
    if (!user || !isCaptain || activeTeamId == null) {
      setJoinRequests([]);
      return;
    }

    let ignore = false;
    getTeamJoinRequests(user, activeTeamId)
      .then((items) => {
        if (!ignore) {
          setJoinRequests(Array.isArray(items) ? items : []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setJoinRequests([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, [user, isCaptain, activeTeamId, savingAction]);

  useEffect(() => {
    if (!isCaptain || !showMyTeamsPanel || !hasTeams) {
      setIsEditPanelOpen(false);
    }
  }, [isCaptain, showMyTeamsPanel, hasTeams]);

  useEffect(() => {
    setJoinRequestPage(1);
  }, [joinRequestSearch, joinRequests]);

  const refreshRoster = async (activeUser = user, requestedTeamId = selectedTeamId) => {
    if (!activeUser) return;
    const [roster, teams, discover] = await Promise.all([
      getTeamRoster(activeUser, requestedTeamId),
      getMyTeams(activeUser),
      discoverTeams(activeUser),
    ]);
    setMembers(roster.members || []);
    setTeamInfo({
      teamId: roster.teamId,
      teamPublicId: roster.teamPublicId || '',
      teamName: roster.teamName,
      teamLogoUrl: roster.teamLogoUrl || '',
      teamDescription: roster.teamDescription || '',
      memberLimit: roster.memberLimit ?? null,
      memberCount: roster.memberCount ?? 0,
      preferredGames: Array.isArray(roster.preferredGames) ? roster.preferredGames : [],
      enlistedTournaments: Array.isArray(roster.enlistedTournaments) ? roster.enlistedTournaments : [],
      captainUserId: roster.captainUserId,
    });
    setSelectedTeamId(roster.teamId ?? null);
    setMyTeams(teams);
    setDiscoverFeed(discover.teams || []);
    setCanRequestJoin(Boolean(discover.canRequestJoin));
    return { roster, teams, discover };
  };

  const normalizeTeamName = (value) => String(value || '').trim().toLowerCase();

  const closeCreateTeamModal = () => {
    setCreateTeamOpen(false);
    setCreateTeamError('');
  };

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    setCreateTeamError('');
    clearNotice();
    if (!user) return;

    const trimmed = teamName.trim();
    if (!trimmed) {
      setCreateTeamError('Please enter a team name.');
      return;
    }

    const normalizedInputName = normalizeTeamName(trimmed);
    const existingTeamNames = new Set([
      ...discoverFeed.map((team) => normalizeTeamName(team?.name)),
      ...myTeams.map((team) => normalizeTeamName(team?.name)),
    ].filter(Boolean));

    if (existingTeamNames.has(normalizedInputName)) {
      setCreateTeamError('That team name is already taken.');
      return;
    }

    setCreating(true);
    try {
      const created = await createTeam(user, trimmed);
      const resolvedName = created?.name || trimmed;
      const nextUser = {
        ...user,
        teamName: resolvedName,
        team: resolvedName,
        currentTeam: resolvedName,
        teamId: created?.id ?? user.teamId,
      };

      updateUser(nextUser);
      setTeamName('');
      setCreateTeamError('');
      closeCreateTeamModal();

      const roster = await getTeamRoster(nextUser);
      setMembers(roster.members || []);
      setTeamInfo({
        teamId: roster.teamId,
        teamPublicId: roster.teamPublicId || (created?.publicId || ''),
        teamName: roster.teamName || resolvedName,
        teamLogoUrl: roster.teamLogoUrl || '',
        teamDescription: roster.teamDescription || '',
        memberLimit: roster.memberLimit ?? null,
        memberCount: roster.memberCount ?? 0,
        preferredGames: Array.isArray(roster.preferredGames) ? roster.preferredGames : [],
        enlistedTournaments: Array.isArray(roster.enlistedTournaments) ? roster.enlistedTournaments : [],
        captainUserId: roster.captainUserId ?? (created?.captainUserId ?? user.id ?? null),
      });
      setSelectedTeamId(roster.teamId ?? created?.id ?? null);
      const teams = await getMyTeams(nextUser);
      setMyTeams(teams);
      const discover = await discoverTeams(nextUser);
      setDiscoverFeed(discover.teams || []);
      setCanRequestJoin(Boolean(discover.canRequestJoin));
      setTeamsView('my');
      showNotice('Team created successfully.');
    } catch (err) {
      setCreateTeamError(err?.message || 'Failed to create team.');
    } finally {
      setCreating(false);
    }
  };

  const onSelectTeam = async (teamId) => {
    setError('');
    clearNotice();
    if (!user) return;

    setSelectedTeamId(teamId);
    try {
      await refreshRoster(user, teamId);
    } catch {
      setError('Failed to load the selected team roster.');
    }
  };

  const validateRenameValue = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      return 'Team name is required.';
    }

    if (trimmed.length < 3) {
      return 'Team name must be at least 3 characters.';
    }

    if (trimmed.length > 60) {
      return 'Team name cannot exceed 60 characters.';
    }

    return '';
  };

  const validateMemberUsernameValue = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      return '';
    }

    if (trimmed.length < 3) {
      return 'Username must be at least 3 characters.';
    }

    if (trimmed.length > 30) {
      return 'Username cannot exceed 30 characters.';
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
      return 'Username can only contain letters, numbers, dot, underscore, or dash.';
    }

    return '';
  };

  const validateLogoUrlValue = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      return '';
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return 'Logo URL must start with http:// or https://.';
      }
    } catch {
      return 'Enter a valid logo URL.';
    }

    if (trimmed.length > 500) {
      return 'Logo URL cannot exceed 500 characters.';
    }

    return '';
  };

  const validateDescriptionValue = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      return '';
    }

    if (trimmed.length > 300) {
      return 'Description cannot exceed 300 characters.';
    }

    return '';
  };

  const validatePreferredGamesValue = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) {
      return '';
    }

    if (trimmed.length > 250) {
      return 'Preferred games cannot exceed 250 characters.';
    }

    const games = trimmed
      .split(',')
      .map((game) => game.trim())
      .filter(Boolean);

    if (games.length > 5) {
      return 'You can list up to 5 preferred games.';
    }

    const duplicateSet = new Set();
    for (const game of games) {
      const key = game.toLowerCase();
      if (duplicateSet.has(key)) {
        return 'Preferred games cannot contain duplicates.';
      }

      duplicateSet.add(key);
      if (game.length > 30) {
        return 'Each game name must be 30 characters or fewer.';
      }
    }

    return '';
  };

  const onAddMember = async (event) => {
    event.preventDefault();
    setError('');
    clearNotice();
    setMemberInputInvalid(false);
    if (!user) return;

    if (!String(memberUsername || '').trim()) {
      setMemberInputInvalid(true);
      return;
    }

    const memberError = validateMemberUsernameValue(memberUsername);
    if (memberError) {
      setMemberInputInvalid(true);
      return;
    }

    setSavingAction('add');
    try {
      await addTeamMember(user, memberUsername.trim(), activeTeamId);
      setMemberUsername('');
      setMemberInputInvalid(false);
      await refreshRoster(user, activeTeamId);
    } catch {
      setMemberInputInvalid(true);
    } finally {
      setSavingAction('');
    }
  };

  const onRemoveMember = async (username) => {
    setError('');
    clearNotice();
    if (!user) return;

    setSavingAction(`remove:${username}`);
    try {
      await removeTeamMember(user, username, activeTeamId);
      await refreshRoster(user, activeTeamId);
    } catch (err) {
      setError(err?.message || 'Failed to remove member.');
    } finally {
      setSavingAction('');
    }
  };

  const onAssignCaptain = async (username) => {
    setError('');
    clearNotice();
    if (!user) return;

    setSavingAction(`captain:${username}`);
    try {
      await assignTeamCaptain(user, username, activeTeamId);
      await refreshRoster(user, activeTeamId);
    } catch (err) {
      setError(err?.message || 'Failed to assign captain.');
    } finally {
      setSavingAction('');
    }
  };

  const onLeaveTeam = async () => {
    setError('');
    clearNotice();
    if (!user) return;

    if (isCaptain) {
      setError('Assign another team member as captain before leaving the team.');
      return;
    }

    setSavingAction('leave');
    try {
      await leaveTeam(user, activeTeamId);
      const { roster } = await refreshRoster(user);
      updateUser({
        ...user,
        teamName: roster.teamName || '',
        team: roster.teamName || '',
        currentTeam: roster.teamName || '',
        teamId: roster.teamId ?? null,
      });
    } catch (err) {
      setError(err?.message || 'Failed to leave team.');
    } finally {
      setSavingAction('');
    }
  };

  const onRenameTeam = async (event) => {
    event.preventDefault();
    setError('');
    clearNotice();
    if (!user) return;

    if (!isCaptain) {
      setError('Only the captain can rename the team.');
      return;
    }

    const renameValidationError = validateRenameValue(renameValue);
    if (renameValidationError) {
      setRenameError(renameValidationError);
      return;
    }

    setSavingAction('rename');
    try {
      const trimmedName = renameValue.trim();
      const renamed = await renameTeam(user, trimmedName, activeTeamId);
      const resolvedName = renamed?.name || trimmedName;
      if ((user?.teamId ?? null) === activeTeamId) {
        updateUser({
          ...user,
          teamName: resolvedName,
          team: resolvedName,
          currentTeam: resolvedName,
        });
      }
      setTeamInfo((current) => ({
        ...current,
        teamName: resolvedName,
      }));
      setRenameValue(resolvedName);
      setRenameError('');
      const teams = await getMyTeams(user);
      setMyTeams(teams);
      showNotice('Team renamed successfully.');
    } catch (err) {
      setError(err?.message || 'Failed to rename team.');
    } finally {
      setSavingAction('');
    }
  };

  const onSaveTeamProfile = async (event) => {
    event.preventDefault();
    setError('');
    clearNotice();
    if (!user) return;

    if (!isCaptain) {
      setError('Only the captain can update team profile details.');
      return;
    }

    if (memberLimitError) {
      setError(memberLimitError);
      return;
    }

    const logoValidationError = logoFile ? '' : validateLogoUrlValue(logoUrl);
    const descriptionValidationError = validateDescriptionValue(description);
    const preferredGamesValidationError = validatePreferredGamesValue(preferredGamesInput);

    setLogoUrlError(logoValidationError);
    setDescriptionError(descriptionValidationError);
    setPreferredGamesError(preferredGamesValidationError);

    if (logoValidationError || descriptionValidationError || preferredGamesValidationError) {
      setError(logoValidationError || descriptionValidationError || preferredGamesValidationError);
      return;
    }

    setSavingAction('profile');
    try {
      let nextLogoUrl = logoUrl.trim();
      if (logoFile) {
        setLogoUploadBusy(true);
        const storedFile = await uploadImage(logoFile, 'teams');
        nextLogoUrl = storedFile?.url || '';
      }

      await updateTeamProfile(user, {
        logoUrl: nextLogoUrl,
        description: description.trim(),
        memberLimit: memberLimitInput === '' ? null : Number(memberLimitInput),
        preferredGames: preferredGamesInput.trim(),
      }, activeTeamId);
      setLogoUploadBusy(false);
      setLogoUrl(nextLogoUrl);
      setLogoFile(null);
      setLogoUrlError('');
      setDescriptionError('');
      setPreferredGamesError('');
      setProfileLogoBroken(false);
      setTeamInfo((current) => ({
        ...current,
        teamLogoUrl: nextLogoUrl,
        teamDescription: description.trim(),
        memberLimit: memberLimitInput === '' ? null : Number(memberLimitInput),
        preferredGames: preferredGamesInput
          .split(',')
          .map((game) => game.trim())
          .filter(Boolean),
      }));
      await refreshRoster(user, activeTeamId);
      showNotice('Team profile updated.');
    } catch (err) {
      setError(err?.message || 'Failed to update team profile.');
    } finally {
      setLogoUploadBusy(false);
      setSavingAction('');
    }
  };

  const onRequestJoinFromFeed = async (teamId) => {
    setError('');
    clearNotice();
    if (!user) return;

    setSavingAction(`join:${teamId}`);
    try {
      await requestTeamJoin(user, {
        teamId,
      });
      setSelectedDiscoverTeam((current) => (current && current.id === teamId ? { ...current, hasPendingRequest: true } : current));
      const discover = await discoverTeams(user);
      setDiscoverFeed(discover.teams || []);
      setCanRequestJoin(Boolean(discover.canRequestJoin));
      showNotice('Your request will be reviewed by the team captain.');
    } catch (err) {
      setError(err?.message || 'Failed to send join request.');
    } finally {
      setSavingAction('');
    }
  };

  const onCancelJoinRequestFromFeed = async (teamId) => {
    setError('');
    clearNotice();
    if (!user) return;

    setSavingAction(`cancel:${teamId}`);
    try {
      await cancelTeamJoinRequest(user, {
        teamId,
      });
      setSelectedDiscoverTeam((current) => (current && current.id === teamId ? { ...current, hasPendingRequest: false } : current));
      const discover = await discoverTeams(user);
      setDiscoverFeed(discover.teams || []);
      setCanRequestJoin(Boolean(discover.canRequestJoin));
      showNotice('Your join request was canceled.');
    } catch (err) {
      setError(err?.message || 'Failed to cancel join request.');
    } finally {
      setSavingAction('');
    }
  };

  const onReviewJoinRequest = async (requestId, action) => {
    setError('');
    clearNotice();
    if (!user) return;

    const token = `${action}:${requestId}`;
    setSavingAction(token);
    try {
      if (action === 'approve') {
        await approveTeamJoinRequest(user, requestId, activeTeamId);
      } else {
        await rejectTeamJoinRequest(user, requestId, activeTeamId);
      }

      await refreshRoster(user, activeTeamId);
      const requests = await getTeamJoinRequests(user, activeTeamId);
      setJoinRequests(requests);
      showNotice(`Join request ${action}d successfully.`);
    } catch (err) {
      setError(err?.message || 'Failed to review join request.');
    } finally {
      setSavingAction('');
    }
  };

  const onDeleteTeam = async () => {
    setError('');
    clearNotice();
    if (!user) return;

    if (!isCaptain) {
      setError('Only the captain can delete the team.');
      return;
    }

    setSavingAction('delete');
    try {
      await deleteTeam(user, activeTeamId);
      const { roster } = await refreshRoster(user);
      updateUser({
        ...user,
        teamName: roster.teamName || '',
        team: roster.teamName || '',
        currentTeam: roster.teamName || '',
        teamId: roster.teamId ?? null,
      });
      setRenameValue('');
      setMemberUsername('');
      showNotice('Team deleted.');
    } catch (err) {
      setError(err?.message || 'Failed to delete team.');
    } finally {
      setSavingAction('');
    }
  };

  const onOpenUserProfile = (userPublicId) => {
    const normalizedPublicId = String(userPublicId || '').trim();
    if (!normalizedPublicId) {
      return;
    }

    navigate(`/users/${encodeURIComponent(normalizedPublicId)}`);
  };

  const filteredDiscoverTeams = useMemo(() => {
    const query = discoverSearch.trim().toLowerCase();
    const compactQuery = query.replace(/[^a-z0-9]/g, '');
    if (!query) {
      return discoverFeed;
    }

    return discoverFeed.filter((team) => {
      const name = String(team.name || '').toLowerCase();
      const rawPublicId = String(team.publicId || team.teamPublicId || '');
      const publicId = rawPublicId.toLowerCase();
      const numericId = String(team.id || '').toLowerCase();

      if (name.includes(query) || publicId.includes(query) || numericId.includes(query)) {
        return true;
      }

      if (!compactQuery) {
        return false;
      }

      const compactPublicId = publicId.replace(/[^a-z0-9]/g, '');
      const compactNumericId = numericId.replace(/[^a-z0-9]/g, '');
      return compactPublicId.includes(compactQuery) || compactNumericId.includes(compactQuery);
    });
  }, [discoverFeed, discoverSearch]);

  const discoverTotalPages = Math.max(1, Math.ceil(filteredDiscoverTeams.length / DISCOVER_PAGE_SIZE));
  const discoverSafePage = Math.min(discoverPage, discoverTotalPages - 1);
  const pagedDiscoverTeams = filteredDiscoverTeams.slice(
    discoverSafePage * DISCOVER_PAGE_SIZE,
    discoverSafePage * DISCOVER_PAGE_SIZE + DISCOVER_PAGE_SIZE
  );

  const discoverRosterMembers = useMemo(() => {
    if (!activeDiscoverTeam || !Array.isArray(activeDiscoverTeam.members)) {
      return [];
    }

    return [...activeDiscoverTeam.members].sort((left, right) => {
      const leftCaptain = String(left?.role || '').toLowerCase() === 'captain';
      const rightCaptain = String(right?.role || '').toLowerCase() === 'captain';

      if (leftCaptain !== rightCaptain) {
        return leftCaptain ? -1 : 1;
      }

      return String(left?.username || '').localeCompare(String(right?.username || ''));
    });
  }, [activeDiscoverTeam]);

  const discoverRosterTotalPages = Math.max(1, Math.ceil(discoverRosterMembers.length / DISCOVER_ROSTER_PAGE_SIZE));
  const discoverRosterSafePage = Math.min(discoverRosterPage, discoverRosterTotalPages - 1);
  const discoverRosterSlice = discoverRosterMembers.slice(
    discoverRosterSafePage * DISCOVER_ROSTER_PAGE_SIZE,
    discoverRosterSafePage * DISCOVER_ROSTER_PAGE_SIZE + DISCOVER_ROSTER_PAGE_SIZE
  );

  const discoverFilteredTournaments = useMemo(() => {
    if (!activeDiscoverTeam || !Array.isArray(activeDiscoverTeam.enlistedTournaments)) {
      return [];
    }

    const eligible = activeDiscoverTeam.enlistedTournaments.filter((entry) => {
      const status = String(entry?.status || '').toLowerCase();
      return status === 'ongoing' || status === 'upcoming';
    });

    return eligible.filter((entry) => String(entry?.status || '').toLowerCase() === discoverTournamentFilter);
  }, [activeDiscoverTeam, discoverTournamentFilter]);

  const discoverTournamentTotalPages = Math.max(1, Math.ceil(discoverFilteredTournaments.length / DISCOVER_TOURNAMENT_PAGE_SIZE));
  const discoverTournamentSafePage = Math.min(discoverTournamentPage, discoverTournamentTotalPages - 1);
  const discoverTournamentSlice = discoverFilteredTournaments.slice(
    discoverTournamentSafePage * DISCOVER_TOURNAMENT_PAGE_SIZE,
    discoverTournamentSafePage * DISCOVER_TOURNAMENT_PAGE_SIZE + DISCOVER_TOURNAMENT_PAGE_SIZE
  );
  const isDiscoverTeamFull = Boolean(
    activeDiscoverTeam
    && activeDiscoverTeam.memberLimit != null
    && activeDiscoverTeam.memberCount >= activeDiscoverTeam.memberLimit
  );

  const filteredJoinRequests = useMemo(() => {
    const query = joinRequestSearch.trim().toLowerCase();
    if (!query) {
      return joinRequests;
    }

    return joinRequests.filter((request) => {
      const username = String(request?.requesterUsername || '').toLowerCase();
      const email = String(request?.requesterEmail || '').toLowerCase();
      return username.includes(query) || email.includes(query);
    });
  }, [joinRequests, joinRequestSearch]);

  const joinRequestTotalPages = Math.max(1, Math.ceil(filteredJoinRequests.length / JOIN_REQUESTS_PAGE_SIZE));
  const joinRequestSafePage = Math.min(joinRequestPage, joinRequestTotalPages);
  const joinRequestStart = (joinRequestSafePage - 1) * JOIN_REQUESTS_PAGE_SIZE;
  const pagedJoinRequests = filteredJoinRequests.slice(
    joinRequestStart,
    joinRequestStart + JOIN_REQUESTS_PAGE_SIZE
  );

  return (
    <section className="team-management-page">
      <article className="surface-card team-view-switch-card" style={{ marginTop: '1rem' }}>
        <div className="team-view-switch">
          {hasTeams ? (
            <button
              type="button"
              className={`team-view-switch-btn ${showMyTeamsPanel ? 'is-active' : ''}`}
              onClick={() => {
                setTeamsView('my');
                if (!selectedTeamId && sortedMyTeams.length > 0) {
                  setSelectedTeamId(sortedMyTeams[0].id);
                }
              }}
            >
              Browse My Teams
            </button>
          ) : null}
          <button
            type="button"
            className={`team-view-switch-btn ${showDiscoverPanel ? 'is-active' : ''}`}
            onClick={() => setTeamsView('discover')}
          >
            Browse Existing Teams
          </button>
          <button
            type="button"
            className="team-view-switch-btn"
            onClick={() => {
              setCreateTeamError('');
              setCreateTeamOpen(true);
            }}
          >
            Create Team
          </button>
        </div>
      </article>

      {!teamsView ? (
        <p className="team-view-switch-hint">Select a view above to continue.</p>
      ) : null}

      {teamsView && notice ? (
        <article className="surface-card" style={{ marginTop: '1rem' }}>
          <p className="team-notice-text">{notice}</p>
        </article>
      ) : null}

      {showMyTeamsPanel ? (
        <article className="surface-card" style={{ marginTop: '1rem' }}>
          <h3>My Teams</h3>
          {!myTeamsLoaded ? (
            <p style={{ marginTop: '0.55rem' }}>Loading teams...</p>
          ) : myTeams.length === 0 ? (
            <p style={{ marginTop: '0.55rem' }}>You are not enrolled in any teams yet.</p>
          ) : (
            <div className="my-teams-list" style={{ marginTop: '0.7rem' }}>
              {sortedMyTeams.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  className={`my-teams-chip ${activeTeamId === team.id ? 'is-active' : ''}`}
                  onClick={() => onSelectTeam(team.id)}
                >
                  {team.name}
                  {team.isCaptain ? ' (Captain)' : ''}
                </button>
              ))}
            </div>
          )}
        </article>
      ) : null}

      {showDiscoverPanel ? (
        <article className="surface-card team-empty-card" style={{ marginTop: '1rem' }}>
          <div className="team-empty-state">
            <div className="team-discover-block">
              <div className="team-discover-toolbar">
                <h3>Browse Existing Teams</h3>
                <label className="team-discover-search-field">
                  <input
                    type="text"
                    value={discoverSearch}
                    onChange={(event) => {
                      setDiscoverSearch(event.target.value);
                      setDiscoverPage(0);
                    }}
                    placeholder="Search teams by name or ID..."
                  />
                </label>
              </div>

              <div className="team-discover-grid">
                {!discoverLoaded ? (
                  <p className="team-empty-error">Loading teams...</p>
                ) : pagedDiscoverTeams.map((team) => {
                  const preferredGames = Array.isArray(team.preferredGames) ? team.preferredGames : [];
                  const visibleGames = preferredGames.slice(0, DISCOVER_VISIBLE_GAMES);
                  const hasMoreGames = preferredGames.length > DISCOVER_VISIBLE_GAMES;

                  return (
                  <article key={team.id} className="team-discover-card">
                    <div className="team-discover-header">
                      <h4>{team.name}</h4>
                      <span>{team.memberCount} members</span>
                    </div>
                    <p className="team-discover-brief">{team.description || 'No description yet.'}</p>

                    <div className="team-discover-games" aria-label="Preferred games">
                      {visibleGames.length > 0 ? visibleGames.map((game, index) => (
                        <span key={`${team.id}-game-${index}`} className="team-game-chip">{game}</span>
                      )) : <span className="team-game-chip">No games listed</span>}
                      {hasMoreGames ? <span className="team-game-chip is-overflow">...</span> : null}
                    </div>

                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => setSelectedDiscoverTeam(team)}
                    >
                      View Details
                    </button>
                  </article>
                  );
                })}
              </div>

              {discoverLoaded && filteredDiscoverTeams.length === 0 ? (
                <p className="team-empty-error">No teams match your search.</p>
              ) : discoverLoaded ? (
                <div className="team-discover-pagination-row">
                  <p>
                    Showing {discoverSafePage * DISCOVER_PAGE_SIZE + 1}-
                    {Math.min((discoverSafePage + 1) * DISCOVER_PAGE_SIZE, filteredDiscoverTeams.length)} of {filteredDiscoverTeams.length}
                  </p>
                  <div className="team-discover-pagination-controls">
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => setDiscoverPage((current) => Math.max(0, current - 1))}
                      disabled={discoverSafePage === 0}
                    >
                      Previous
                    </button>
                    <span>Page {discoverSafePage + 1} / {discoverTotalPages}</span>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => setDiscoverPage((current) => Math.min(discoverTotalPages - 1, current + 1))}
                      disabled={discoverSafePage >= discoverTotalPages - 1}
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {error && <p className="error-text team-empty-error">{error}</p>}
          </div>
        </article>
      ) : null}

      {teamsView && error ? <p className="error-text" style={{ marginTop: '0.85rem' }}>{error}</p> : null}

      {showMyTeamsPanel && hasTeams ? (
        <article className="surface-card team-profile-card" style={{ marginTop: '1rem' }}>
          <div className={`team-profile-preview ${!isCaptain ? 'is-member-scroll' : ''}`}>
            {teamInfo.teamLogoUrl && !profileLogoBroken ? (
              <img
                src={teamInfo.teamLogoUrl}
                alt={`${teamInfo.teamName} logo`}
                onError={() => setProfileLogoBroken(true)}
              />
            ) : (
              <div className="team-profile-logo-placeholder" aria-label="No team logo">?</div>
            )}
            <div className="team-profile-content">
              <div className="team-profile-title-row">
                <h4>{teamInfo.teamName || 'Team'}</h4>
                {activeTeamPublicId ? <span className="team-profile-public-id">ID: {activeTeamPublicId}</span> : null}
              </div>
              <p className={isCaptain ? 'team-profile-description-scroll' : ''}>{teamInfo.teamDescription || 'No description provided.'}</p>
              <p style={{ marginTop: '0.35rem' }}>
                <strong>Member limit:</strong> {teamInfo.memberLimit != null ? `${teamInfo.memberCount}/${teamInfo.memberLimit}` : `${teamInfo.memberCount}/No limit`}
              </p>
              {teamInfo.preferredGames.length > 0 ? (
                <p><strong>Preferred games:</strong> {teamInfo.preferredGames.join(', ')}</p>
              ) : (
                <p><strong>Preferred games:</strong> No preferred games provided.</p>
              )}
            </div>
          </div>
          {!isCaptain ? (
            <div className="team-roster-inline-note">
              <p>Only captains can add/remove members or assign a new captain.</p>
              <button type="button" className="ghost-btn danger-btn" onClick={onLeaveTeam} disabled={savingAction === 'leave'}>
                {savingAction === 'leave' ? 'Leaving...' : 'Leave Team'}
              </button>
            </div>
          ) : null}
        </article>
      ) : null}

      {showMyTeamsPanel && hasTeams && isCaptain ? (
        <div className="surface-card team-action-panel-card" style={{ marginTop: '1rem' }}>
          <div className="team-action-panel-head">
            <h3>Edit Team</h3>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setIsEditPanelOpen((current) => !current)}
            >
              {isEditPanelOpen ? 'Minimize' : 'Open Edit Panel'}
            </button>
          </div>

          {isEditPanelOpen ? <div className="team-action-panel">
            <form onSubmit={onRenameTeam} className="team-action-row">
                    <label className="team-inline-field">
                      Team name
                      <input
                        value={renameValue}
                        onChange={(e) => {
                          setRenameValue(e.target.value);
                          const nextError = validateRenameValue(e.target.value);
                          setRenameError(nextError);
                        }}
                        placeholder="Enter a team name"
                        className={renameError ? 'team-input-error' : ''}
                        aria-invalid={Boolean(renameError)}
                      />
                      {renameError ? <p className="error-text" style={{ marginTop: '0.35rem' }}>{renameError}</p> : null}
                    </label>
                    <button type="submit" className="primary-btn" disabled={savingAction === 'rename' || Boolean(renameError)}>
                      {savingAction === 'rename' ? 'Saving...' : 'Rename Team'}
                    </button>
            </form>

            <form onSubmit={onAddMember} className="team-action-row">
                    <label className="team-inline-field">
                      Add member by username
                      <input
                        value={memberUsername}
                        onChange={(e) => {
                          setMemberUsername(e.target.value);
                          setMemberInputInvalid(Boolean(validateMemberUsernameValue(e.target.value)));
                        }}
                        placeholder="Enter username"
                        className={memberInputInvalid ? 'team-input-error' : ''}
                        aria-invalid={memberInputInvalid}
                      />
                    </label>
                    <button type="submit" className="primary-btn" disabled={savingAction === 'add' || memberInputInvalid}>
                      {savingAction === 'add' ? 'Adding...' : 'Add Member'}
                    </button>
            </form>

            <form onSubmit={onSaveTeamProfile} className="team-profile-form">
                    <label className="team-inline-field">
                      Team logo URL
                      <input
                        value={logoUrl}
                        onChange={(e) => {
                          setLogoUrl(e.target.value);
                          setLogoUrlError(logoFile ? '' : validateLogoUrlValue(e.target.value));
                        }}
                        placeholder="https://..."
                        className={logoUrlError ? 'team-input-error' : ''}
                        aria-invalid={Boolean(logoUrlError)}
                      />
                      {logoUrlError ? <p className="error-text" style={{ marginTop: '0.35rem' }}>{logoUrlError}</p> : null}
                    </label>
                    <label className="team-inline-field">
                      Upload team logo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          setLogoFile(e.target.files?.[0] ?? null);
                          if (e.target.files?.[0]) {
                            setLogoUrlError('');
                          }
                        }}
                      />
                      <small style={{ color: 'var(--muted)' }}>
                        {logoFile ? `Selected: ${logoFile.name}. Uploaded file will override the URL above.` : 'Optional. Upload to store the logo in S3.'}
                      </small>
                    </label>
                    <label className="team-inline-field">
                      Team description
                      <input
                        value={description}
                        onChange={(e) => {
                          setDescription(e.target.value);
                          setDescriptionError(validateDescriptionValue(e.target.value));
                        }}
                        placeholder="Describe your team (300 words max)"
                        className={descriptionError ? 'team-input-error' : ''}
                        aria-invalid={Boolean(descriptionError)}
                      />
                      {descriptionError ? <p className="error-text" style={{ marginTop: '0.35rem' }}>{descriptionError}</p> : null}
                    </label>
                    <label className="team-inline-field">
                      Member limit (optional)
                      <input
                        type="number"
                        min="1"
                        value={memberLimitInput}
                        onChange={(e) => {
                          setMemberLimitInput(e.target.value);
                          if (memberLimitError) {
                            setMemberLimitError('');
                          }
                        }}
                        placeholder="No limit"
                        className={memberLimitError ? 'team-input-error' : ''}
                        aria-invalid={Boolean(memberLimitError)}
                      />
                      {memberLimitError ? <p className="error-text" style={{ marginTop: '0.35rem' }}>{memberLimitError}</p> : null}
                    </label>
                    <label className="team-inline-field">
                      Preferred games (comma separated)
                      <input
                        value={preferredGamesInput}
                        onChange={(e) => {
                          setPreferredGamesInput(e.target.value);
                          setPreferredGamesError(validatePreferredGamesValue(e.target.value));
                        }}
                        placeholder="Valorant, CS2, Apex"
                        className={preferredGamesError ? 'team-input-error' : ''}
                        aria-invalid={Boolean(preferredGamesError)}
                      />
                      {preferredGamesError ? <p className="error-text" style={{ marginTop: '0.35rem' }}>{preferredGamesError}</p> : null}
                    </label>
                    <div className="team-action-row team-action-row-end">
                      <button
                        type="submit"
                        className="primary-btn"
                        disabled={
                          savingAction === 'profile'
                          || logoUploadBusy
                          || Boolean(memberLimitError)
                          || Boolean(logoUrlError)
                          || Boolean(descriptionError)
                          || Boolean(preferredGamesError)
                        }
                      >
                        {logoUploadBusy ? 'Uploading logo...' : savingAction === 'profile' ? 'Saving...' : 'Save Team Profile'}
                      </button>
                    </div>
            </form>

            <div className="team-action-row team-action-row-end">
                <button type="button" className="ghost-btn danger-btn" onClick={onLeaveTeam} disabled={savingAction === 'leave'}>
                  {savingAction === 'leave' ? 'Leaving...' : 'Leave Team'}
                </button>
                <button type="button" className="ghost-btn danger-btn" onClick={onDeleteTeam} disabled={savingAction === 'delete'}>
                  {savingAction === 'delete' ? 'Deleting...' : 'Delete Team'}
                </button>
            </div>
          </div> : <p className="team-action-panel-collapsed-note">Edit panel minimized. Open it to manage team settings.</p>}
        </div>
      ) : null}

      {showMyTeamsPanel && hasTeams ? (
        <article className="surface-card team-roster-card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '0.6rem' }}>Roster Table</h3>
          {members.length > 0 ? (
            <TeamRoster
              members={members}
              captainUserId={teamInfo.captainUserId}
              canManage={isCaptain}
              savingAction={savingAction}
              currentUserId={user?.id ?? null}
              currentUsername={user?.username ?? user?.gamerTag ?? ''}
              onRemoveMember={onRemoveMember}
              onAssignCaptain={onAssignCaptain}
              onOpenUserProfile={onOpenUserProfile}
            />
          ) : <p style={{ marginTop: '0.5rem' }}>No roster members available right now.</p>}
        </article>
      ) : null}

      {showMyTeamsPanel && hasTeams && isCaptain ? (
        <article className="surface-card team-join-requests-card" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '0.6rem' }}>Join Requests</h3>
          <div className="table-shell">
            <div className="roster-toolbar">
              <label className="roster-search-field">
                <input
                  type="text"
                  value={joinRequestSearch}
                  onChange={(event) => setJoinRequestSearch(event.target.value)}
                  placeholder="Search by username or email"
                />
              </label>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedJoinRequests.length > 0 ? pagedJoinRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.requesterUsername || '-'}</td>
                    <td>{request.requesterEmail || '-'}</td>
                    <td>
                      <div className="roster-actions-row">
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={() => onReviewJoinRequest(request.id, 'approve')}
                          disabled={savingAction === `approve:${request.id}` || savingAction === `reject:${request.id}`}
                        >
                          {savingAction === `approve:${request.id}` ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          className="ghost-btn danger-btn"
                          onClick={() => onReviewJoinRequest(request.id, 'reject')}
                          disabled={savingAction === `approve:${request.id}` || savingAction === `reject:${request.id}`}
                        >
                          {savingAction === `reject:${request.id}` ? 'Rejecting...' : 'Reject'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3}>No pending join requests found.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="roster-pagination-row">
              <span>
                Showing {filteredJoinRequests.length === 0 ? 0 : joinRequestStart + 1}-
                {Math.min(joinRequestStart + JOIN_REQUESTS_PAGE_SIZE, filteredJoinRequests.length)} of {filteredJoinRequests.length}
              </span>
              <div className="roster-pagination-controls">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setJoinRequestPage((current) => Math.max(1, current - 1))}
                  disabled={joinRequestSafePage <= 1}
                >
                  Previous
                </button>
                <span>Page {joinRequestSafePage} / {joinRequestTotalPages}</span>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setJoinRequestPage((current) => Math.min(joinRequestTotalPages, current + 1))}
                  disabled={joinRequestSafePage >= joinRequestTotalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </article>
      ) : null}

      {showMyTeamsPanel && hasTeams ? (() => {
        const filteredEnlisted = teamInfo.enlistedTournaments.filter((entry) =>
          entry.name.toLowerCase().includes(enlistedSearch.toLowerCase().trim())
        );
        const totalEnlistedPages = Math.max(1, Math.ceil(filteredEnlisted.length / ENLISTED_COLS));
        const safeEnlistedPage = Math.min(enlistedPage, totalEnlistedPages - 1);
        const enlistedSlice = filteredEnlisted.slice(
          safeEnlistedPage * ENLISTED_COLS,
          safeEnlistedPage * ENLISTED_COLS + ENLISTED_COLS
        );

        return (
          <article className="surface-card team-enlisted-card" style={{ marginTop: '1rem' }}>
            <div className="team-enlisted-header">
              <h3>Enlisted Tournaments</h3>
              <label className="team-enlisted-search-field">
                <input
                  type="text"
                  value={enlistedSearch}
                  onChange={(e) => { setEnlistedSearch(e.target.value); setEnlistedPage(0); }}
                  placeholder="Search tournaments..."
                />
              </label>
            </div>

            {filteredEnlisted.length === 0 ? (
              <p style={{ marginTop: '0.6rem' }}>
                {teamInfo.enlistedTournaments.length === 0 ? 'No tournament enlistments yet.' : 'No tournaments match your search.'}
              </p>
            ) : (
              <div className="team-enlisted-carousel">
                <button
                  type="button"
                  className="ghost-btn team-enlisted-nav"
                  onClick={() => setEnlistedPage((p) => Math.max(0, p - 1))}
                  disabled={safeEnlistedPage === 0}
                  aria-label="Previous tournaments"
                >
                  &#8249;
                </button>

                <div className="team-enlisted-grid">
                  {enlistedSlice.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className="team-enlisted-cell"
                      onClick={() => navigate(`/tournaments/${entry.publicId || entry.id}`)}
                    >
                      <div className="team-enlisted-cell-img">
                        {entry.image
                          ? <img src={entry.image} alt={entry.name} />
                          : <span className="team-enlisted-cell-no-img">?</span>}
                      </div>
                      <span className="team-enlisted-cell-name">{entry.name}</span>
                      <span className="team-enlisted-cell-desc">
                        {entry.description?.trim() || 'No description available.'}
                      </span>
                      <span className="team-enlisted-status is-enlisted">
                        Enlisted
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="ghost-btn team-enlisted-nav"
                  onClick={() => setEnlistedPage((p) => Math.min(totalEnlistedPages - 1, p + 1))}
                  disabled={safeEnlistedPage >= totalEnlistedPages - 1}
                  aria-label="Next tournaments"
                >
                  &#8250;
                </button>
              </div>
            )}

            {filteredEnlisted.length > 0 ? (
              <p className="team-enlisted-page-indicator">
                Page {safeEnlistedPage + 1} / {totalEnlistedPages}
              </p>
            ) : null}
          </article>
        );
      })() : null}

      {activeDiscoverTeam ? (
        <div className="tournament-modal-backdrop" role="presentation" onClick={() => setSelectedDiscoverTeam(null)}>
          <article className="surface-card tournament-modal team-details-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className={`team-details-modal-head ${activeDiscoverTeam.publicId ? 'with-public-id' : ''}`}>
              <h3>{activeDiscoverTeam.name}</h3>
              {activeDiscoverTeam.publicId ? <span className="team-details-modal-public-id">{activeDiscoverTeam.publicId}</span> : null}
              <button type="button" className="ghost-btn" onClick={() => setSelectedDiscoverTeam(null)}>Close</button>
            </div>

            <div className="tournament-modal-layout">
              <div className="tournament-modal-image-panel team-details-image-panel">
                {activeDiscoverTeam.logoUrl && !discoverLogoBroken ? (
                  <img
                    src={activeDiscoverTeam.logoUrl}
                    alt={`${activeDiscoverTeam.name} logo`}
                    className="tournament-modal-image team-details-modal-image"
                    onError={() => setDiscoverLogoBroken(true)}
                  />
                ) : (
                  <div className="tournament-modal-image-placeholder">?</div>
                )}
              </div>
              <div className="tournament-modal-copy-panel">
                <h4>Team Overview</h4>
                <section className="team-details-desc-section">
                  <p className="tournament-modal-description team-details-desc-scroll">{activeDiscoverTeam.description || 'No description yet.'}</p>
                  <p className="team-details-preferred-games-text">
                    <strong>Preferred games:</strong> {activeDiscoverTeam.preferredGames?.length ? activeDiscoverTeam.preferredGames.join(', ') : 'Not specified'}
                  </p>
                </section>

                <p className="team-details-preferred-games-text">
                  <strong>Members:</strong> {activeDiscoverTeam.memberCount}
                </p>
                {activeDiscoverTeam.memberLimit != null ? (
                  <p className="team-details-preferred-games-text">
                    <strong>Member limit:</strong> {activeDiscoverTeam.memberCount}/{activeDiscoverTeam.memberLimit}
                  </p>
                ) : null}
                <p className="team-details-preferred-games-text">
                  <strong>Enlisted tournaments:</strong> {activeDiscoverTeam.enlistedTournaments?.length || 0}
                </p>
              </div>
            </div>

            <section className="team-details-roster-section">
              <div className="team-details-subhead-row">
                <h5>Roster</h5>
                <span>Page {discoverRosterSafePage + 1} / {discoverRosterTotalPages}</span>
              </div>
              <div className="team-details-roster-table-shell">
                <table className="team-details-roster-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discoverRosterSlice.length > 0 ? discoverRosterSlice.map((member) => (
                      <tr key={`${member.id}-${member.username}`}>
                        <td>
                          <button
                            type="button"
                            className="linklike-btn roster-user-link"
                            disabled={!member.publicId}
                            onClick={() => onOpenUserProfile(member.publicId)}
                          >
                            {member.username}
                          </button>
                        </td>
                        <td>{member.role}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={2}>No roster members found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="team-details-mini-pagination">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setDiscoverRosterPage((page) => Math.max(0, page - 1))}
                  disabled={discoverRosterSafePage === 0}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setDiscoverRosterPage((page) => Math.min(discoverRosterTotalPages - 1, page + 1))}
                  disabled={discoverRosterSafePage >= discoverRosterTotalPages - 1}
                >
                  Next
                </button>
              </div>
            </section>

            <section className="team-details-tournaments-section">
              <div className="team-details-subhead-row">
                <h5>Enlisted Tournaments</h5>
                <label className="team-details-tournament-filter">
                  <span>Filter</span>
                  <select
                    value={discoverTournamentFilter}
                    onChange={(event) => setDiscoverTournamentFilter(event.target.value)}
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </label>
              </div>

              <div className="team-details-roster-table-shell">
                <table className="team-details-roster-table">
                  <thead>
                    <tr>
                      <th>Tournament</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discoverTournamentSlice.length > 0 ? discoverTournamentSlice.map((entry) => (
                      <tr
                        key={`discover-tournament-${entry.id}`}
                        className="team-details-tournament-row-item"
                        onClick={() => navigate(`/tournaments/${entry.publicId || entry.id}`)}
                      >
                        <td>{entry.name}</td>
                        <td className="team-details-tournament-status">{entry.status || '-'}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={2}>No {discoverTournamentFilter} tournaments found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="team-details-mini-pagination">
                <span>Page {discoverTournamentSafePage + 1} / {discoverTournamentTotalPages}</span>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setDiscoverTournamentPage((page) => Math.max(0, page - 1))}
                  disabled={discoverTournamentSafePage === 0}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setDiscoverTournamentPage((page) => Math.min(discoverTournamentTotalPages - 1, page + 1))}
                  disabled={discoverTournamentSafePage >= discoverTournamentTotalPages - 1}
                >
                  Next
                </button>
              </div>
            </section>

            <div className="team-details-modal-actions">
              <button
                type="button"
                className={activeDiscoverTeam.isMember
                  ? 'ghost-btn team-details-disabled-btn'
                  : isDiscoverTeamFull
                    ? 'ghost-btn team-details-disabled-btn'
                    : activeDiscoverTeam.hasPendingRequest
                    ? 'ghost-btn danger-btn'
                    : 'primary-btn'}
                disabled={activeDiscoverTeam.isMember || isDiscoverTeamFull || savingAction === `join:${activeDiscoverTeam.id}` || savingAction === `cancel:${activeDiscoverTeam.id}`}
                onClick={() => {
                  if (activeDiscoverTeam.isMember) {
                    return;
                  }

                  if (isDiscoverTeamFull) {
                    return;
                  }

                  if (activeDiscoverTeam.hasPendingRequest) {
                    onCancelJoinRequestFromFeed(activeDiscoverTeam.id);
                    return;
                  }

                  onRequestJoinFromFeed(activeDiscoverTeam.id);
                }}
              >
                {activeDiscoverTeam.isMember
                  ? 'Already a Member'
                  : isDiscoverTeamFull
                    ? 'Team is Full'
                  : activeDiscoverTeam.hasPendingRequest
                  ? (savingAction === `cancel:${activeDiscoverTeam.id}`
                    ? 'Canceling...'
                    : 'Cancel Request')
                  : savingAction === `join:${activeDiscoverTeam.id}`
                    ? 'Requesting...'
                    : 'Request to Join'}
              </button>
            </div>
          </article>
        </div>
      ) : null}

      {createTeamOpen ? (
        <div className="tournament-modal-backdrop" role="presentation" onClick={closeCreateTeamModal}>
          <article className="surface-card tournament-modal team-details-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="team-details-modal-head">
              <h3>Create Team</h3>
              <button type="button" className="ghost-btn" onClick={closeCreateTeamModal}>Close</button>
            </div>

            <form onSubmit={handleCreateTeam} className="team-create-modal-form">
              <label className="team-inline-field">
                Team name
                <input
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder="Enter a team name"
                />
              </label>
              {createTeamError ? <p className="error-text" style={{ marginTop: '0.55rem' }}>{createTeamError}</p> : null}
              <div className="team-details-modal-actions">
                <button type="submit" className="primary-btn" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </article>
        </div>
      ) : null}
    </section>
  );
}

export default TeamManagement;
