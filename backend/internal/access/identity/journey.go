// Package identity defines account, membership and tenant-entry decisions.
// It does not authenticate credentials, issue cookies, persist records or
// replace the existing internal/platform/authz operation authorizer.
package identity

import (
	"errors"
	"sort"
	"strings"
)

type TenantStatus string
const (
	TenantPending TenantStatus = "pending"
	TenantActive TenantStatus = "active"
	TenantSuspended TenantStatus = "suspended"
	TenantClosed TenantStatus = "closed"
)
type MemberStatus string
const (
	MemberInvited MemberStatus = "invited"
	MemberActive MemberStatus = "active"
	MemberSuspended MemberStatus = "suspended"
	MemberRemoved MemberStatus = "removed"
)
type EntryMode string
const (
	EntryNoTenant EntryMode = "no_tenant"
	EntryDirect EntryMode = "direct"
	EntryChoose EntryMode = "choose"
	EntryPlatform EntryMode = "platform"
)

var (
	ErrAccountInactive = errors.New("identity: account inactive")
	ErrInvalidAuthority = errors.New("identity: invalid or inconsistent authority")
	ErrTenantDenied = errors.New("identity: tenant membership not active")
	ErrVersionConflict = errors.New("identity: membership version conflict")
	ErrTransitionDenied = errors.New("identity: membership transition denied")
	ErrLastOwner = errors.New("identity: last owner is protected")
	ErrSelfDeactivation = errors.New("identity: self deactivation is prohibited")
	ErrActivationProof = errors.New("identity: activation proof required")
	ErrSessionChanged = errors.New("identity: session context changed")
	ErrSessionRevoked = errors.New("identity: session not usable")
)

type Account struct {
	ID string
	Active bool
	PlatformOperator bool
}
type Membership struct {
	AccountID string
	TenantID string
	Status MemberStatus
	Version uint64
	Owner bool
}
type Entry struct {
	Mode EntryMode
	TenantID string
	AvailableTenantIDs []string
}

// ResolveEntry is called only after a trusted adapter verifies Account.
// A saved tenant ID is never authority. There is no automatic choice for N>1.
func ResolveEntry(account Account, memberships []Membership, tenantStates map[string]TenantStatus) (Entry, error) {
	if strings.TrimSpace(account.ID) == "" || !account.Active {
		return Entry{}, ErrAccountInactive
	}
	if account.PlatformOperator {
		return Entry{Mode: EntryPlatform}, nil
	}
	seen := map[string]bool{}
	available := []string{}
	for _, member := range memberships {
		if member.AccountID != account.ID || strings.TrimSpace(member.TenantID) == "" || member.Version == 0 {
			return Entry{}, ErrInvalidAuthority
		}
		if seen[member.TenantID] {
			return Entry{}, ErrInvalidAuthority
		}
		seen[member.TenantID] = true
		status, exists := tenantStates[member.TenantID]
		if !exists {
			return Entry{}, ErrInvalidAuthority
		}
		if member.Status == MemberActive && status == TenantActive {
			available = append(available, member.TenantID)
		}
	}
	sort.Strings(available)
	switch len(available) {
	case 0:
		return Entry{Mode: EntryNoTenant, AvailableTenantIDs: available}, nil
	case 1:
		return Entry{Mode: EntryDirect, TenantID: available[0], AvailableTenantIDs: available}, nil
	default:
		return Entry{Mode: EntryChoose, AvailableTenantIDs: available}, nil
	}
}

// SelectTenant checks a fresh server-side entry projection, not client metadata.
func SelectTenant(entry Entry, tenantID string) (string, error) {
	if entry.Mode == EntryPlatform || strings.TrimSpace(tenantID) == "" {
		return "", ErrTenantDenied
	}
	for _, candidate := range entry.AvailableTenantIDs {
		if candidate == tenantID {
			return candidate, nil
		}
	}
	return "", ErrTenantDenied
}

type MemberAction string
const (
	Activate MemberAction = "activate"
	Suspend MemberAction = "suspend"
	Remove MemberAction = "remove"
	Restore MemberAction = "restore"
)
type MemberChange struct {
	ActorAccountID string
	ActorTenantID string
	Target Membership
	ExpectedVersion uint64
	Action MemberAction
	Reason string
	// ONLY set after one-time activation proof is consumed by the real store.
	VerifiedActivation bool
	// MUST be computed under an authoritative transactional lock.
	ActiveOwnerCount int
	// Provided by the existing current operation-specific authorizer.
	Authorized bool
}
type MemberResult struct {
	Membership Membership
	RevokeTenantSessions bool
	RecheckGrants bool
}

// ChangeMember proposes a transition. Persist it atomically with revocation,
// audit and outbox effects; it does not itself grant roles or recreate sessions.
func ChangeMember(input MemberChange) (MemberResult, error) {
	current := input.Target
	if !input.Authorized || strings.TrimSpace(input.ActorAccountID) == "" ||
		input.ActorTenantID != current.TenantID || current.TenantID == "" ||
		current.AccountID == "" || current.Version == 0 {
		return MemberResult{}, ErrInvalidAuthority
	}
	if input.ExpectedVersion != current.Version {
		return MemberResult{}, ErrVersionConflict
	}
	next := current
	result := MemberResult{}
	switch input.Action {
	case Activate:
		if current.Status != MemberInvited && current.Status != MemberSuspended {
			return MemberResult{}, ErrTransitionDenied
		}
		if current.Status == MemberInvited && !input.VerifiedActivation {
			return MemberResult{}, ErrActivationProof
		}
		next.Status = MemberActive
		result.RecheckGrants = true
	case Suspend, Remove:
		if strings.TrimSpace(input.Reason) == "" {
			return MemberResult{}, ErrTransitionDenied
		}
		if current.AccountID == input.ActorAccountID {
			return MemberResult{}, ErrSelfDeactivation
		}
		if current.Owner && current.Status == MemberActive && input.ActiveOwnerCount <= 1 {
			return MemberResult{}, ErrLastOwner
		}
		if input.Action == Suspend {
			if current.Status != MemberActive {
				return MemberResult{}, ErrTransitionDenied
			}
			next.Status = MemberSuspended
		} else {
			if current.Status == MemberRemoved {
				return MemberResult{}, ErrTransitionDenied
			}
			next.Status = MemberRemoved
		}
		result.RevokeTenantSessions = true
	case Restore:
		if current.Status != MemberRemoved || strings.TrimSpace(input.Reason) == "" {
			return MemberResult{}, ErrTransitionDenied
		}
		next.Status = MemberActive
		result.RecheckGrants = true
	default:
		return MemberResult{}, ErrTransitionDenied
	}
	next.Version++
	result.Membership = next
	return result, nil
}
type Session struct {
	AccountID string
	ActiveTenantID string
	ContextVersion uint64
	Revoked bool
	Expired bool
}

// CheckTenantRequest precedes platform/authz. A restored Membership can never
// resurrect a previously revoked browser Session.
func CheckTenantRequest(s Session, expectedVersion uint64, account Account, member Membership, tenant TenantStatus) error {
	if s.Revoked || s.Expired || s.AccountID == "" || s.ContextVersion == 0 ||
		!account.Active || s.AccountID != account.ID {
		return ErrSessionRevoked
	}
	if s.ContextVersion != expectedVersion {
		return ErrSessionChanged
	}
	if s.ActiveTenantID == "" || member.TenantID != s.ActiveTenantID ||
		member.AccountID != account.ID || member.Status != MemberActive ||
		tenant != TenantActive {
		return ErrTenantDenied
	}
	return nil
}
