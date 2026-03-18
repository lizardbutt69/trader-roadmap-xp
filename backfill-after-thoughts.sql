-- ============================================
-- Backfill after_thoughts from March TSV data
-- Match on date + asset + direction (+ profit for disambiguation)
-- Run this in Supabase SQL Editor
-- ============================================

-- Mar 3: NQ Short (profit 815)
UPDATE trades SET after_thoughts = 'Solid trade, displacement lower took awhile, but we held through it. Almost at the 4hr FVG where the original target was but trailed stop to 2R.'
WHERE dt::date = '2026-03-03' AND asset = '$NQ' AND direction = 'Short';

-- Mar 4: GC Short (profit -460)
UPDATE trades SET after_thoughts = 'Alright, honesty here. Perhaps forcing something on GC even when Garrett said there wasn''t anything clean here. Try harder, Danny.  Also it took out a high and then going lower now. Hmm.'
WHERE dt::date = '2026-03-04' AND asset = '$GC' AND direction = 'Short';

-- Mar 6: GC Long (profit -495)
UPDATE trades SET after_thoughts = 'Entered the trade, looked so good. And then it sucked, just consolidating, nothing moving. Lol - in a HTF gap which maybe why but hmm'
WHERE dt::date = '2026-03-06' AND asset = '$GC' AND direction = 'Long';

-- Mar 6: NQ Short (profit -465)
UPDATE trades SET after_thoughts = 'This could''ve been avoidable. Right before heading out to dinner - I knew not to take this. Also, new 4hr candle just right around the corner for continuations'
WHERE dt::date = '2026-03-06' AND asset = '$NQ' AND direction = 'Short';

-- Mar 9: NQ Long (funded account, profit NULL)
UPDATE trades SET after_thoughts = '(-345 on account) Played out, lol. The original SL was the invalidation, not my managed SL move. The entire trade idea from SMT fill was A++'
WHERE dt::date = '2026-03-09' AND asset = '$NQ' AND direction = 'Long';

-- Mar 9: NQ Short (profit -462)
UPDATE trades SET after_thoughts = 'NQ 4hr SMT Fill for higher and 90m 2-stage - actually really clean. Ugh - why am I always bearish bias''d'
WHERE dt::date = '2026-03-09' AND asset = '$NQ' AND direction = 'Short';

-- Mar 9: GC Short (profit -397)
UPDATE trades SET after_thoughts = 'Metals are chopped. Just shouldn''t be trading it, just look at the HTF.'
WHERE dt::date = '2026-03-09' AND asset = '$GC' AND direction = 'Short';

-- Mar 10: NQ Long #1 (personal, profit 244) - use profit to disambiguate
UPDATE trades SET after_thoughts = 'Price did hit 2R above pdHigh like the rest of the triad - was trying to hold it to the fractal swings above for more. But in the end it hit trailed SL. Should I have TP''d? Probably. But practicing holding these trades for full TP.'
WHERE dt::date = '2026-03-10' AND asset = '$NQ' AND direction = 'Long' AND profit = 244;

-- Mar 10: NQ Long #2 (funded, profit NULL) - use profit to disambiguate
UPDATE trades SET after_thoughts = 'Closed the trade to get the funded essentially at B/E and was hoping price would deliver a SMT fill - would''ve taken it again if it did.'
WHERE dt::date = '2026-03-10' AND asset = '$NQ' AND direction = 'Long' AND profit IS NULL;

-- Mar 11: NQ Short (profit -481.5)
UPDATE trades SET after_thoughts = 'Looked ok for a second there. Then decided to retrace after new 4hr candle open higher. Needed that continuation..'
WHERE dt::date = '2026-03-11' AND asset = '$NQ' AND direction = 'Short';

-- Mar 11: NQ Long (profit -472.5)
UPDATE trades SET after_thoughts = 'NQ looking horrible here - valid but horrible PA. Needed to sit this one out.'
WHERE dt::date = '2026-03-11' AND asset = '$NQ' AND direction = 'Long';

-- Mar 12: GC Short (profit 998)
UPDATE trades SET after_thoughts = 'Bang!! 2/2 for today. Great trading - patience, determination, and execution.'
WHERE dt::date = '2026-03-12' AND asset = '$GC' AND direction = 'Short';

-- Mar 13: NQ Short (funded, profit NULL)
UPDATE trades SET after_thoughts = 'Solid trade - Trailed out at at least 2R on this. ES hit that low I wanted NQ to hit first so there was a reaction. Got the funded back to B/E'
WHERE dt::date = '2026-03-13' AND asset = '$NQ' AND direction = 'Short';

-- Mar 13: ES Long (profit 23)
UPDATE trades SET after_thoughts = 'Missed taking it on funded account, nice reaction after entry. NQ was also a good entry too on 3m. Exited at 10am didn''t look good for me. ** Glad I exited - it didn''t look good for continuations at 10'
WHERE dt::date = '2026-03-13' AND asset = '$ES' AND direction = 'Long';

-- Mar 13: GC Short (profit 1254)
UPDATE trades SET after_thoughts = 'Full TP! Epic trade and hold, conviction and price action. Nice pivot to this trade rather than ES long which never played out. Profit on both accounts. Very good trade to end the week. Keep it going.'
WHERE dt::date = '2026-03-13' AND asset = '$GC' AND direction = 'Short';

-- Mar 16: GC Short (profit 400)
UPDATE trades SET after_thoughts = 'Silver was indeed the weaker asset via SS. But hard to take risk on Silver. Let''s see how it does. Currently 1hr C4 - looking for continuation. Stops moved to BE but we are holding to Asia Lows. Trailed SL hit - was so close to ASL. +554 on Funded too. Trade played out'
WHERE dt::date = '2026-03-16' AND asset = '$GC' AND direction = 'Short';

-- Mar 16: YM Short (profit 15)
UPDATE trades SET after_thoughts = 'Wasn''t that bad of a trade. Took out a low. We wanted lower. Trailed B/E'
WHERE dt::date = '2026-03-16' AND asset = '$YM' AND direction = 'Short';

-- Mar 17: NQ Short (profit 126.5)
UPDATE trades SET after_thoughts = 'Trailed out. Looked really good. But was really chopping around and then a push lower. Discount for higher, maybe. We will wait for London for clearer PA. +91.43 on Funded (also trailed). Update: Aggressive move back to downside.. Would''ve played out.'
WHERE dt::date = '2026-03-17' AND asset = '$NQ' AND direction = 'Short';

-- Mar 17: SI Short (funded, profit NULL)
UPDATE trades SET after_thoughts = '-537 on funded. Hmm wasn''t clean PA after entry. Chopped around. .'
WHERE dt::date = '2026-03-17' AND asset = '$SI' AND direction = 'Short';

-- Mar 18: GC Long (funded, profit NULL)
UPDATE trades SET after_thoughts = 'Solid move higher - got trailed stopped. Took most of it right before Asia Highs - it almost got there. Daily profile does support more downside. So SMT now with Asia Highs'
WHERE dt::date = '2026-03-18' AND asset = '$GC' AND direction = 'Long';

-- Mar 18: GC Short (profit -201)
UPDATE trades SET after_thoughts = 'Mechanically got the 3m ICCISD to confirm more downside. But price retraced more than I like. Still holding and still can move lower. Would like to see another ICCISD. Got the 3m/5m ICCISD lower. So let''s see if it holds. Fast move to downside, taking a short term low and huge retracement back. Pdlow so close... (Another update: guess what, trade panned out, just did another 3m fractal) sharp move down.'
WHERE dt::date = '2026-03-18' AND asset = '$GC' AND direction = 'Short';

-- Mar 18: NQ Short (profit -303.5)
UPDATE trades SET after_thoughts = 'Dumb loss, we eat it and move on. Looks like price wants to move lower now after getting stopped out. Ahh yes, the goodl ol'' stop and go. The SL should''ve been the original CISD. AHHHH it went...'
WHERE dt::date = '2026-03-18' AND asset = '$NQ' AND direction = 'Short';
