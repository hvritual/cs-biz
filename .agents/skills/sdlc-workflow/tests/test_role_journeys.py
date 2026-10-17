"""Role-journey contract counterexamples; synthetic declarations are not UI proof."""
import copy
from pathlib import Path
import runpy
import sys
import tempfile
import unittest

PACKAGE = Path(__file__).resolve().parents[2] / 'sdlc-design'
sys.path.insert(0, str(PACKAGE / 'scripts'))
from review_checks import delivery_check, plan_check


class RoleJourneyTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'raw.txt').write_text('SYNTHETIC R1 only\n')
        builder = runpy.run_path(str(PACKAGE / 'scripts/create_review_examples.py'))
        self.raw = builder['ref'](self.root, 'raw.txt')
        self.plan, self.delivery = builder['review_assets'](self.root, self.raw)
        self.builder = builder

    def check_plan(self):
        return plan_check(self.root, self.plan, self.raw)

    def check_delivery(self):
        self.builder['write'](self.root / 'review-plan.json', self.plan)
        self.delivery['plan_ref'] = self.builder['ref'](self.root, 'review-plan.json')
        return delivery_check(self.root, self.delivery, self.plan,
                              self.delivery['plan_ref'], self.raw)

    def test_examples_use_full_role_journeys_and_keep_task_efficiency(self):
        self.assertEqual(self.plan['protocol'], 'design-review-plan-v2')
        self.assertGreater(self.plan['journeys'][0]['action_count'], 4)
        self.check_plan()
        self.check_delivery()

    def test_page_checks_without_journeys_are_rejected(self):
        self.plan.pop('journeys', None)
        with self.assertRaisesRegex(Exception, 'journeys'):
            self.check_plan()

    def test_required_task_branch_cannot_disappear(self):
        self.plan['journeys'][0]['branches'].pop()
        with self.assertRaisesRegex(Exception, 'path coverage'):
            self.check_plan()

    def test_role_change_requires_visible_handoff(self):
        self.plan['journeys'][0]['walkthrough'][-1]['actor_id'] = 'admin'
        with self.assertRaisesRegex(Exception, 'role continuity'):
            self.check_plan()

    def test_handoff_consumes_the_created_business_record(self):
        handoff = next(v for v in self.plan['journeys'][0]['walkthrough'] if v['kind'] == 'handoff')
        handoff['consumes'] = ['invented-operation']
        with self.assertRaisesRegex(Exception, 'object continuity'):
            self.check_plan()

    def test_tools_and_mid_journey_reset_are_not_human_actions(self):
        for name in ('review_tools_in_user_path', 'reset_during_walkthrough'):
            with self.subTest(name=name):
                original = copy.deepcopy(self.plan)
                self.plan['journeys'][0]['fixture_setup'][name] = True
                with self.assertRaisesRegex(Exception, 'executor setup'):
                    self.check_plan()
                self.plan = original

    def test_cumulative_actions_include_navigation_and_handoff(self):
        self.plan['journeys'][0]['action_count'] -= 1
        with self.assertRaisesRegex(Exception, 'action count'):
            self.check_plan()

    def test_observed_page_paths_do_not_replace_continuous_walkthrough(self):
        self.delivery['observation'].pop('journey_runs', None)
        with self.assertRaisesRegex(Exception, 'journey runs'):
            self.check_delivery()

    def test_observation_cannot_skip_navigation(self):
        self.delivery['observation']['journey_runs'][0]['walkthrough_runs'][0]['steps'].pop(0)
        with self.assertRaisesRegex(Exception, 'continuous actions'):
            self.check_delivery()

    def test_cross_role_object_cannot_be_replaced_with_a_seeded_record(self):
        run = self.delivery['observation']['journey_runs'][0]['walkthrough_runs'][0]
        run['object_bindings'][-1]['value'] = 'another-operation'
        with self.assertRaisesRegex(Exception, 'business object drift'):
            self.check_delivery()

    def test_agent_walkthrough_is_not_human_material_approval(self):
        self.delivery['state'] = 'DESIGN_APPROVED'
        self.delivery['human_review'] = {
            'decision': 'approved', 'candidate_sha': self.delivery['candidate_sha'],
            'version': self.delivery['target']['version'], 'url': self.delivery['target']['url'],
            'plan_ref': self.delivery['plan_ref'], 'actor_kind': 'human',
            'reviewer': 'synthetic-only', 'reviewed_at': '2026-10-17T00:00:00Z',
            'record_ref': self.delivery['observation']['record_ref']}
        with self.assertRaisesRegex(Exception, 'Human journey reviews'):
            self.check_delivery()

    def test_ordinary_business_task_does_not_authenticate_a_role(self):
        self.plan['journeys'][0]['walkthrough'].pop(0)
        with self.assertRaisesRegex(Exception, 'authenticate'):
            self.check_plan()

    def test_receiving_role_must_sign_in(self):
        self.plan['journeys'][0]['walkthrough'] = [
            v for v in self.plan['journeys'][0]['walkthrough'] if v['id'] != 'support-login']
        with self.assertRaisesRegex(Exception, 'authenticate'):
            self.check_plan()

    def test_recovery_cannot_use_a_different_seeded_original(self):
        journey = self.plan['journeys'][0]
        journey['starting_objects'].append('old-seeded-operation')
        branch = next(v for v in journey['branches'] if v['id'] == 'unknown')
        branch['walkthrough'][0].update(consumes=['old-seeded-operation'], result_key='old-seeded-operation')
        with self.assertRaisesRegex(Exception, 'triggering original'):
            self.check_plan()

    def test_original_journey_mapping_is_required(self):
        self.plan.pop('original_journey_coverage')
        with self.assertRaisesRegex(Exception, 'original journeys'):
            self.check_plan()

    def test_external_scope_cannot_be_shrunk_by_editing_the_plan(self):
        with self.assertRaisesRegex(Exception, 'frozen original'):
            plan_check(self.root, self.plan, self.raw, expected_scope={
                'journey_ids': ['J1', 'J2'], 'role_ids': ['admin', 'support'], 'task_paths': []})

    def test_each_human_branch_role_receipt_binds_the_actual_version(self):
        self.delivery['state'] = 'DESIGN_APPROVED'
        self.delivery['human_review'] = self.builder['synthetic_approval'](self.delivery)
        receipt = self.delivery['human_review']['journey_reviews'][0]['walkthrough_reviews'][0]['role_reviews'][0]
        receipt['candidate_sha'] = 'b' * 40
        with self.assertRaisesRegex(Exception, 'Human role version drift'):
            self.check_delivery()

    def test_experience_is_for_the_requirement_originator(self):
        self.plan['experience'] = {'audience': 'independent_tester'}
        with self.assertRaisesRegex(Exception, 'requirement originator'):
            self.check_plan()

    def test_requester_operation_flow_is_a_bound_deliverable(self):
        self.plan.pop('experience', None)
        with self.assertRaisesRegex(Exception, 'experience operation flow'):
            self.check_plan()

    def test_review_overlays_do_not_qualify_as_product_experience(self):
        self.delivery['observation']['experience_ui'] = {
            'product_interface': True, 'review_chrome_visible': True,
            'engineering_copy_visible': False}
        with self.assertRaisesRegex(Exception, 'product experience'):
            self.check_delivery()

    def test_presented_operation_flow_must_match_the_plan(self):
        self.delivery['presentation']['experience_guide_ref'] = self.raw
        with self.assertRaisesRegex(Exception, 'operation flow differs'):
            self.check_delivery()

    def test_another_human_is_not_the_requirement_originator(self):
        self.delivery['state'] = 'DESIGN_APPROVED'
        self.delivery['human_review'] = self.builder['synthetic_approval'](self.delivery)
        self.delivery['human_review']['reviewer_role'] = 'independent_tester'
        with self.assertRaisesRegex(Exception, 'requirement originator'):
            self.check_delivery()


if __name__ == '__main__':
    unittest.main()
