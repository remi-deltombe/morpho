-- Seed system languages with their tenses

-- English
INSERT INTO languages (id, name, code, is_system, user_id) 
VALUES ('00000000-0000-0000-0000-000000000001', 'English', 'en', TRUE, NULL);

INSERT INTO tenses (language_id, name, display_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Simple Present', 1),
  ('00000000-0000-0000-0000-000000000001', 'Present Continuous', 2),
  ('00000000-0000-0000-0000-000000000001', 'Present Perfect', 3),
  ('00000000-0000-0000-0000-000000000001', 'Present Perfect Continuous', 4),
  ('00000000-0000-0000-0000-000000000001', 'Simple Past', 5),
  ('00000000-0000-0000-0000-000000000001', 'Past Continuous', 6),
  ('00000000-0000-0000-0000-000000000001', 'Past Perfect', 7),
  ('00000000-0000-0000-0000-000000000001', 'Past Perfect Continuous', 8),
  ('00000000-0000-0000-0000-000000000001', 'Simple Future', 9),
  ('00000000-0000-0000-0000-000000000001', 'Future Continuous', 10),
  ('00000000-0000-0000-0000-000000000001', 'Future Perfect', 11),
  ('00000000-0000-0000-0000-000000000001', 'Future Perfect Continuous', 12),
  ('00000000-0000-0000-0000-000000000001', 'Conditional', 13),
  ('00000000-0000-0000-0000-000000000001', 'Conditional Perfect', 14),
  ('00000000-0000-0000-0000-000000000001', 'Imperative', 15);

-- French
INSERT INTO languages (id, name, code, is_system, user_id) 
VALUES ('00000000-0000-0000-0000-000000000002', 'French', 'fr', TRUE, NULL);

INSERT INTO tenses (language_id, name, display_order) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Présent', 1),
  ('00000000-0000-0000-0000-000000000002', 'Passé composé', 2),
  ('00000000-0000-0000-0000-000000000002', 'Imparfait', 3),
  ('00000000-0000-0000-0000-000000000002', 'Plus-que-parfait', 4),
  ('00000000-0000-0000-0000-000000000002', 'Passé simple', 5),
  ('00000000-0000-0000-0000-000000000002', 'Passé antérieur', 6),
  ('00000000-0000-0000-0000-000000000002', 'Futur simple', 7),
  ('00000000-0000-0000-0000-000000000002', 'Futur antérieur', 8),
  ('00000000-0000-0000-0000-000000000002', 'Conditionnel présent', 9),
  ('00000000-0000-0000-0000-000000000002', 'Conditionnel passé', 10),
  ('00000000-0000-0000-0000-000000000002', 'Subjonctif présent', 11),
  ('00000000-0000-0000-0000-000000000002', 'Subjonctif passé', 12),
  ('00000000-0000-0000-0000-000000000002', 'Subjonctif imparfait', 13),
  ('00000000-0000-0000-0000-000000000002', 'Subjonctif plus-que-parfait', 14),
  ('00000000-0000-0000-0000-000000000002', 'Impératif', 15),
  ('00000000-0000-0000-0000-000000000002', 'Participe présent', 16),
  ('00000000-0000-0000-0000-000000000002', 'Participe passé', 17);

-- Finnish
INSERT INTO languages (id, name, code, is_system, user_id) 
VALUES ('00000000-0000-0000-0000-000000000003', 'Finnish', 'fi', TRUE, NULL);

INSERT INTO tenses (language_id, name, display_order) VALUES
  ('00000000-0000-0000-0000-000000000003', 'Preesens (Present)', 1),
  ('00000000-0000-0000-0000-000000000003', 'Imperfekti (Past)', 2),
  ('00000000-0000-0000-0000-000000000003', 'Perfekti (Perfect)', 3),
  ('00000000-0000-0000-0000-000000000003', 'Pluskvamperfekti (Pluperfect)', 4),
  ('00000000-0000-0000-0000-000000000003', 'Konditionaali (Conditional)', 5),
  ('00000000-0000-0000-0000-000000000003', 'Potentiaali (Potential)', 6),
  ('00000000-0000-0000-0000-000000000003', 'Imperatiivi (Imperative)', 7),
  ('00000000-0000-0000-0000-000000000003', 'Passiivi preesens (Passive Present)', 8),
  ('00000000-0000-0000-0000-000000000003', 'Passiivi imperfekti (Passive Past)', 9),
  ('00000000-0000-0000-0000-000000000003', 'Infinitiivi I (Infinitive I)', 10),
  ('00000000-0000-0000-0000-000000000003', 'Infinitiivi II (Infinitive II)', 11),
  ('00000000-0000-0000-0000-000000000003', 'Infinitiivi III (Infinitive III)', 12),
  ('00000000-0000-0000-0000-000000000003', 'Infinitiivi IV (Infinitive IV)', 13),
  ('00000000-0000-0000-0000-000000000003', 'Partisiipit (Participles)', 14);
