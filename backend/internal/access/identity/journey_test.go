package identity

import (
	"errors"
	"testing"
)

func TestResolveEntryZeroOneManyPlatform(t *testing.T) {
	account := Account{ID: "alice", Active: true}
	tenants := map[string]TenantStatus{"a": TenantActive, "b": TenantActive, "c": TenantSuspended}
	members := []Membership{
		{AccountID: "alice", TenantID: "b", Status: MemberActive, Version: 1},
		{AccountID: "alice", TenantID: "a", Status: MemberActive, Version: 1},
		{AccountID: "alice", TenantID: "c", Status: MemberActive, Version: 1},
	}
	e, err := ResolveEntry(account, members, tenants)
	if err != nil || e.Mode != EntryChoose || e.TenantID != "" || len(e.AvailableTenantIDs) != 2 || e.AvailableTenantIDs[0] != "a" {
		t.Fatalf("multi: %+v %v", e, err)
	}
	if _, err := SelectTenant(e, "c"); !errors.Is(err, ErrTenantDenied) { t.Fatal(err) }
	if got, err := SelectTenant(e, "b"); err != nil || got != "b" { t.Fatalf("%q %v", got, err) }
	e, err = ResolveEntry(account, members[1:2], tenants)
	if err != nil || e.Mode != EntryDirect || e.TenantID != "a" { t.Fatalf("one %+v %v", e, err) }
	e, err = ResolveEntry(account, members[2:], tenants)
	if err != nil || e.Mode != EntryNoTenant { t.Fatalf("zero %+v %v", e, err) }
	e, err = ResolveEntry(Account{ID: "root", Active: true, PlatformOperator: true}, nil, tenants)
	if err != nil || e.Mode != EntryPlatform { t.Fatalf("platform %+v %v", e, err) }
	if _, err := SelectTenant(e, "a"); !errors.Is(err, ErrTenantDenied) { t.Fatal(err) }
}

func TestEntryFailsClosedOnInvalidAuthority(t *testing.T) {
	a := Account{ID: "alice", Active: true}
	tenants := map[string]TenantStatus{"a": TenantActive}
	cases := [][]Membership{
		{{AccountID: "other", TenantID: "a", Status: MemberActive, Version: 1}},
		{{AccountID: "alice", TenantID: "unknown", Status: MemberActive, Version: 1}},
		{{AccountID: "alice", TenantID: "a", Status: MemberActive, Version: 1}, {AccountID: "alice", TenantID: "a", Status: MemberActive, Version: 1}},
	}
	for i, members := range cases {
		if _, err := ResolveEntry(a, members, tenants); !errors.Is(err, ErrInvalidAuthority) { t.Fatalf("case %d: %v", i, err) }
	}
	if _, err := ResolveEntry(Account{ID: "alice"}, nil, tenants); !errors.Is(err, ErrAccountInactive) { t.Fatal(err) }
}

func TestMemberTransitionCASIsolationOwner(t *testing.T) {
	input := MemberChange{
		ActorAccountID: "admin", ActorTenantID: "a",
		Target: Membership{AccountID: "bob", TenantID: "a", Status: MemberActive, Version: 7},
		ExpectedVersion: 7, Action: Suspend, Reason: "leave", Authorized: true, ActiveOwnerCount: 2,
	}
	result, err := ChangeMember(input)
	if err != nil || result.Membership.Status != MemberSuspended || result.Membership.Version != 8 || !result.RevokeTenantSessions {
		t.Fatalf("suspend %+v %v", result, err)
	}
	input.ExpectedVersion--
	if _, err := ChangeMember(input); !errors.Is(err, ErrVersionConflict) { t.Fatal(err) }
	input.ExpectedVersion++
	input.ActorTenantID = "b"
	if _, err := ChangeMember(input); !errors.Is(err, ErrInvalidAuthority) { t.Fatal(err) }
	input.ActorTenantID = "a"
	input.ActorAccountID = "bob"
	if _, err := ChangeMember(input); !errors.Is(err, ErrSelfDeactivation) { t.Fatal(err) }
	input.ActorAccountID = "admin"
	input.Target.Owner = true
	input.ActiveOwnerCount = 1
	if _, err := ChangeMember(input); !errors.Is(err, ErrLastOwner) { t.Fatal(err) }
}

func TestActivationRestoreNeverRevivesOldSessions(t *testing.T) {
	input := MemberChange{
		ActorAccountID: "admin", ActorTenantID: "a",
		Target: Membership{AccountID: "new", TenantID: "a", Status: MemberInvited, Version: 1},
		ExpectedVersion: 1, Action: Activate, Authorized: true,
	}
	if _, err := ChangeMember(input); !errors.Is(err, ErrActivationProof) { t.Fatal(err) }
	input.VerifiedActivation = true
	activated, err := ChangeMember(input)
	if err != nil || !activated.RecheckGrants || activated.Membership.Status != MemberActive { t.Fatalf("%+v %v", activated, err) }
	input.Target.Status = MemberRemoved
	input.Action = Restore
	input.Reason = "approved"
	restored, err := ChangeMember(input)
	if err != nil || !restored.RecheckGrants || restored.RevokeTenantSessions { t.Fatalf("%+v %v", restored, err) }
	old := Session{AccountID: "new", ActiveTenantID: "a", ContextVersion: 3, Revoked: true}
	if err := CheckTenantRequest(old, 3, Account{ID: "new", Active: true}, restored.Membership, TenantActive); !errors.Is(err, ErrSessionRevoked) { t.Fatal(err) }
}

func TestCheckTenantRequestFreshContext(t *testing.T) {
	a := Account{ID: "bob", Active: true}
	m := Membership{AccountID: "bob", TenantID: "b", Status: MemberActive, Version: 3}
	s := Session{AccountID: "bob", ActiveTenantID: "b", ContextVersion: 9}
	if err := CheckTenantRequest(s, 9, a, m, TenantActive); err != nil { t.Fatal(err) }
	if err := CheckTenantRequest(s, 8, a, m, TenantActive); !errors.Is(err, ErrSessionChanged) { t.Fatal(err) }
	if err := CheckTenantRequest(s, 9, a, m, TenantSuspended); !errors.Is(err, ErrTenantDenied) { t.Fatal(err) }
	if err := CheckTenantRequest(s, 9, a, Membership{AccountID: "bob", TenantID: "a", Status: MemberActive}, TenantActive); !errors.Is(err, ErrTenantDenied) { t.Fatal(err) }
	s.ActiveTenantID = ""
	if err := CheckTenantRequest(s, 9, a, m, TenantActive); !errors.Is(err, ErrTenantDenied) { t.Fatal(err) }
}
