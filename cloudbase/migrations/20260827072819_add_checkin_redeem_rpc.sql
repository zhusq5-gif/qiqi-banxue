-- 七七伴学 P1：打卡/兑换 RPC 数据库函数（官方推荐的事务封装方式）
-- SECURITY INVOKER（默认）：以调用者身份执行，受 RLS 约束，auth.uid() 可用

CREATE OR REPLACE FUNCTION public.checkin(p_subject_id uuid, p_date date)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_stars int;
  v_id uuid;
BEGIN
  SELECT stars INTO v_stars FROM public.subjects WHERE id = p_subject_id AND archived_at IS NULL;
  IF v_stars IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'subject_not_found');
  END IF;

  BEGIN
    INSERT INTO public.checkins (owner_id, subject_id, date, stars_awarded)
    VALUES (auth.uid(), p_subject_id, p_date, v_stars)
    RETURNING id INTO v_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END;

  INSERT INTO public.star_ledger (owner_id, delta, reason, ref_type, ref_id)
  VALUES (auth.uid(), v_stars, 'checkin', 'checkin', v_id::text);

  RETURN jsonb_build_object('ok', true, 'already', false, 'stars', v_stars);
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem(p_wish_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_wish public.wishes%ROWTYPE;
  v_balance int;
  v_id uuid;
BEGIN
  SELECT * INTO v_wish FROM public.wishes WHERE id = p_wish_id AND archived_at IS NULL;
  IF v_wish.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'wish_not_found');
  END IF;

  SELECT COALESCE(SUM(delta), 0) INTO v_balance FROM public.star_ledger;

  IF v_balance < v_wish.stars THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_stars', 'balance', v_balance);
  END IF;

  INSERT INTO public.wish_redemptions (owner_id, wish_id, stars_spent)
  VALUES (auth.uid(), p_wish_id, v_wish.stars)
  RETURNING id INTO v_id;

  INSERT INTO public.star_ledger (owner_id, delta, reason, ref_type, ref_id)
  VALUES (auth.uid(), -v_wish.stars, 'redeem', 'wish_redemption', v_id::text);

  RETURN jsonb_build_object('ok', true, 'stars_spent', v_wish.stars, 'balance', v_balance - v_wish.stars);
END;
$$;

GRANT EXECUTE ON FUNCTION public.checkin(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem(uuid) TO authenticated;
