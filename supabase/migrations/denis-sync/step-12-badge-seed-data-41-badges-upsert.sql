-- =============================================
-- 12. BADGE SEED DATA (41 badges, UPSERT)
-- =============================================

INSERT INTO badges (key, name, subtitle, description, icon, is_public_eligible, sort_order, rarity, family, category) VALUES
  ('hidden_gem_finder', 'Hidden Gem Finder', 'Spotted potential', 'Voted early on a dish that became a hidden gem', '💎', false, 84, 'common', 'discovery', NULL),
  ('gem_hunter', 'Gem Hunter', 'Sharp eye for quality', 'Found 5 hidden gems before the crowd', '🔍', false, 82, 'uncommon', 'discovery', NULL),
  ('gem_collector', 'Gem Collector', 'Treasure hunter', 'Discovered 10 hidden gems early', '🏆', true, 80, 'rare', 'discovery', NULL),
  ('good_call', 'Good Call', 'Nailed it', 'Predicted a dish would be great and the crowd agreed', '📞', false, 102, 'common', 'discovery', NULL),
  ('taste_prophet', 'Taste Prophet', 'Ahead of the curve', 'Called it right on 3 dishes before consensus', '🔮', false, 100, 'uncommon', 'discovery', NULL),
  ('oracle', 'Oracle', 'The taste whisperer', 'Predicted 5 crowd favorites before anyone else', '🌟', true, 98, 'rare', 'discovery', NULL),
  ('steady_hand', 'Steady Hand', 'Right on target', 'Global bias within 0.5 of consensus with 20+ rated', '🎯', true, 60, 'uncommon', 'consistency', NULL),
  ('tough_critic', 'Tough Critic', 'Holding the line', 'Consistently rates below consensus (bias <= -1.5)', '🧐', false, 58, 'uncommon', 'consistency', NULL),
  ('generous_spirit', 'Generous Spirit', 'Spreading the love', 'Consistently rates above consensus (bias >= 1.5)', '💛', false, 56, 'uncommon', 'consistency', NULL),
  ('taste_maker', 'Taste Maker', 'Building a following', '10+ followers trust your taste', '📣', false, 48, 'uncommon', 'influence', NULL),
  ('trusted_voice', 'Trusted Voice', 'People listen', '25+ followers trust your taste', '🎙️', true, 46, 'rare', 'influence', NULL),
  ('specialist_pizza', 'Pizza Specialist', 'Pizza expert', '10+ consensus-rated pizza dishes with accurate taste', '🍕', true, 40, 'rare', 'category', 'pizza'),
  ('authority_pizza', 'Pizza Authority', 'Pizza master', '20+ consensus-rated pizza dishes with elite accuracy', '🍕', true, 39, 'epic', 'category', 'pizza'),
  ('specialist_burger', 'Burger Specialist', 'Burger expert', '10+ consensus-rated burger dishes with accurate taste', '🍔', true, 40, 'rare', 'category', 'burger'),
  ('authority_burger', 'Burger Authority', 'Burger master', '20+ consensus-rated burger dishes with elite accuracy', '🍔', true, 39, 'epic', 'category', 'burger'),
  ('specialist_taco', 'Taco Specialist', 'Taco expert', '10+ consensus-rated taco dishes with accurate taste', '🌮', true, 40, 'rare', 'category', 'taco'),
  ('authority_taco', 'Taco Authority', 'Taco master', '20+ consensus-rated taco dishes with elite accuracy', '🌮', true, 39, 'epic', 'category', 'taco'),
  ('specialist_wings', 'Wings Specialist', 'Wings expert', '10+ consensus-rated wing dishes with accurate taste', '🍗', true, 40, 'rare', 'category', 'wings'),
  ('authority_wings', 'Wings Authority', 'Wings master', '20+ consensus-rated wing dishes with elite accuracy', '🍗', true, 39, 'epic', 'category', 'wings'),
  ('specialist_sushi', 'Sushi Specialist', 'Sushi expert', '10+ consensus-rated sushi dishes with accurate taste', '🍣', true, 40, 'rare', 'category', 'sushi'),
  ('authority_sushi', 'Sushi Authority', 'Sushi master', '20+ consensus-rated sushi dishes with elite accuracy', '🍣', true, 39, 'epic', 'category', 'sushi'),
  ('specialist_sandwich', 'Sandwich Specialist', 'Sandwich expert', '10+ consensus-rated sandwich dishes with accurate taste', '🥪', true, 40, 'rare', 'category', 'sandwich'),
  ('authority_sandwich', 'Sandwich Authority', 'Sandwich master', '20+ consensus-rated sandwich dishes with elite accuracy', '🥪', true, 39, 'epic', 'category', 'sandwich'),
  ('specialist_pasta', 'Pasta Specialist', 'Pasta expert', '10+ consensus-rated pasta dishes with accurate taste', '🍝', true, 40, 'rare', 'category', 'pasta'),
  ('authority_pasta', 'Pasta Authority', 'Pasta master', '20+ consensus-rated pasta dishes with elite accuracy', '🍝', true, 39, 'epic', 'category', 'pasta'),
  ('specialist_lobster_roll', 'Lobster Roll Specialist', 'Lobster roll expert', '10+ consensus-rated lobster roll dishes with accurate taste', '🦞', true, 40, 'rare', 'category', 'lobster roll'),
  ('authority_lobster_roll', 'Lobster Roll Authority', 'Lobster roll master', '20+ consensus-rated lobster roll dishes with elite accuracy', '🦞', true, 39, 'epic', 'category', 'lobster roll'),
  ('specialist_seafood', 'Seafood Specialist', 'Seafood expert', '10+ consensus-rated seafood dishes with accurate taste', '🦐', true, 40, 'rare', 'category', 'seafood'),
  ('authority_seafood', 'Seafood Authority', 'Seafood master', '20+ consensus-rated seafood dishes with elite accuracy', '🦐', true, 39, 'epic', 'category', 'seafood'),
  ('specialist_chowder', 'Chowder Specialist', 'Chowder expert', '10+ consensus-rated chowder dishes with accurate taste', '🍲', true, 40, 'rare', 'category', 'chowder'),
  ('authority_chowder', 'Chowder Authority', 'Chowder master', '20+ consensus-rated chowder dishes with elite accuracy', '🍲', true, 39, 'epic', 'category', 'chowder'),
  ('specialist_breakfast', 'Breakfast Specialist', 'Breakfast expert', '10+ consensus-rated breakfast dishes with accurate taste', '🍳', true, 40, 'rare', 'category', 'breakfast'),
  ('authority_breakfast', 'Breakfast Authority', 'Breakfast master', '20+ consensus-rated breakfast dishes with elite accuracy', '🍳', true, 39, 'epic', 'category', 'breakfast'),
  ('specialist_salad', 'Salad Specialist', 'Salad expert', '10+ consensus-rated salad dishes with accurate taste', '🥗', true, 40, 'rare', 'category', 'salad'),
  ('authority_salad', 'Salad Authority', 'Salad master', '20+ consensus-rated salad dishes with elite accuracy', '🥗', true, 39, 'epic', 'category', 'salad'),
  ('specialist_dessert', 'Dessert Specialist', 'Dessert expert', '10+ consensus-rated dessert dishes with accurate taste', '🍰', true, 40, 'rare', 'category', 'dessert'),
  ('authority_dessert', 'Dessert Authority', 'Dessert master', '20+ consensus-rated dessert dishes with elite accuracy', '🍰', true, 39, 'epic', 'category', 'dessert'),
  ('specialist_steak', 'Steak Specialist', 'Steak connoisseur', 'Rated 10+ consensus-rated steak dishes with low bias', '🥩', true, 29, 'rare', 'category', 'steak'),
  ('authority_steak', 'Steak Authority', 'Steak master', 'Rated 20+ consensus-rated steak dishes with very low bias', '🥩', true, 28, 'epic', 'category', 'steak'),
  ('specialist_tendys', 'Tenders Specialist', 'Tender expert', 'Rated 10+ consensus-rated tenders dishes with low bias', '🍗', true, 31, 'rare', 'category', 'tendys'),
  ('authority_tendys', 'Tenders Authority', 'Tender master', 'Rated 20+ consensus-rated tenders dishes with very low bias', '🍗', true, 30, 'epic', 'category', 'tendys')
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name, subtitle = EXCLUDED.subtitle, description = EXCLUDED.description,
  icon = EXCLUDED.icon, is_public_eligible = EXCLUDED.is_public_eligible,
  sort_order = EXCLUDED.sort_order, rarity = EXCLUDED.rarity, family = EXCLUDED.family,
  category = EXCLUDED.category;


