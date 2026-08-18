class_name TycoonEconomy
extends RefCounted

const SAVE_VERSION := 2

func create_store_economy(store: Dictionary, tenant_def: Dictionary, week: int, catalog_data: Dictionary) -> Dictionary:
	if _is_vacant(store):
		return {
			"lease_id": "vacant_w%d" % week,
			"base_rent": 0,
			"revenue_share": 0.0,
			"term_weeks": 0,
			"renewal_week": week,
			"rent_tolerance": 1.0,
			"prestige_tier": 0,
			"preferred_adjacencies": [],
			"disliked_adjacencies": [],
			"target_personalities": [],
			"satisfaction": 0,
			"state": "vacant",
			"last_revenue": 0,
			"weekly_sales": 0,
			"weekly_served": 0,
			"last_served": 0,
			"weekly_profit": 0,
			"last_statement": "Vacant unit. Lease a tenant to generate rent and foot traffic.",
			"risk_reasons": ["vacant"]
		}

	var profile := _profile_for_tenant(tenant_def, catalog_data)
	var lot_mult := _lot_rent_multiplier(str(store.get("lot_type", "standard")))
	var base_income := int(store.get("base_income", tenant_def.get("base_income", 90)))
	var base_rent := roundi(float(profile.get("base_rent", 360)) * lot_mult + float(base_income) * 1.8)

	return {
		"lease_id": "%s_w%d" % [str(store.get("tenant_id", tenant_def.get("id", "tenant"))), week],
		"base_rent": base_rent,
		"revenue_share": float(profile.get("revenue_share", 0.08)),
		"term_weeks": int(profile.get("term_weeks", 8)),
		"renewal_week": week + int(profile.get("term_weeks", 8)),
		"rent_tolerance": float(profile.get("rent_tolerance", 0.38)),
		"prestige_tier": int(profile.get("prestige_tier", 1)),
		"preferred_adjacencies": profile.get("preferred_adjacencies", []),
		"disliked_adjacencies": profile.get("disliked_adjacencies", []),
		"target_personalities": profile.get("target_personalities", []),
		"satisfaction": 76,
		"state": "open",
		"last_revenue": int(store.get("revenue", 0)),
		"weekly_sales": 0,
		"weekly_served": 0,
		"last_served": int(store.get("served", 0)),
		"weekly_profit": 0,
		"last_statement": "Lease initialized. Awaiting first weekly accounting.",
		"risk_reasons": []
	}

func ensure_store_economy(store: Dictionary, tenant_def: Dictionary, week: int, catalog_data: Dictionary) -> void:
	if not store.has("economy") or not store.economy is Dictionary or store.economy.is_empty():
		store.economy = create_store_economy(store, tenant_def, week, catalog_data)
		return

	var economy: Dictionary = store.economy
	var fresh := create_store_economy(store, tenant_def, week, catalog_data)
	for key in fresh.keys():
		if not economy.has(key):
			economy[key] = fresh[key]

func process_weekly_accounting(
	stores: Array,
	catalog_data: Dictionary,
	week: int,
	cleanliness: int,
	security: int,
	reputation: int,
	amenity_count: int
) -> Dictionary:
	var total_rent := 0
	var total_revenue_share := 0
	var payroll := 0
	var reports: Array[Dictionary] = []
	var at_risk_count := 0
	var total_tenant_satisfaction := 0

	for i in stores.size():
		var store: Dictionary = stores[i]
		var tenant_def := _find_tenant_by_id(str(store.get("tenant_id", "")), catalog_data)
		ensure_store_economy(store, tenant_def, week, catalog_data)
		var economy: Dictionary = store.economy

		if _is_vacant(store):
			economy.state = "vacant"
			economy.last_statement = "Vacant unit. Lease a tenant to generate rent and foot traffic."
			reports.append({
				"store_index": i,
				"name": str(store.get("name", "Vacant Unit")),
				"state": "vacant",
				"satisfaction": 0,
				"weekly_sales": 0,
				"weekly_profit": 0,
				"base_rent": 0,
				"revenue_share_income": 0,
				"statement": economy.last_statement,
				"risk_reasons": ["vacant"]
			})
			continue

		var previous_revenue := int(economy.get("last_revenue", 0))
		var current_revenue := int(store.get("revenue", 0))
		var weekly_sales := maxi(0, current_revenue - previous_revenue)
		var previous_served := int(economy.get("last_served", 0))
		var current_served := int(store.get("served", 0))
		var weekly_served := maxi(0, current_served - previous_served)
		var base_rent := int(economy.get("base_rent", 360))
		var share_income := roundi(float(weekly_sales) * float(economy.get("revenue_share", 0.08)))
		var staff_cost := int(store.get("staff", 2)) * 85
		var tenant_profit := weekly_sales - base_rent - staff_cost
		var satisfaction := _score_tenant(store, economy, weekly_sales, weekly_served, cleanliness, security, reputation)
		var reasons := _risk_reasons(store, economy, weekly_sales, weekly_served, cleanliness, security, satisfaction)
		var lifecycle := _lifecycle_for_score(satisfaction, weekly_sales, int(store.get("draw", 35)))

		economy.weekly_sales = weekly_sales
		economy.weekly_served = weekly_served
		economy.weekly_profit = tenant_profit
		economy.satisfaction = satisfaction
		economy.state = lifecycle
		economy.last_revenue = current_revenue
		economy.last_served = current_served
		economy.risk_reasons = reasons
		economy.last_statement = _statement_for(store, weekly_sales, tenant_profit, satisfaction, lifecycle, reasons)

		total_rent += base_rent
		total_revenue_share += share_income
		payroll += staff_cost
		total_tenant_satisfaction += satisfaction
		if lifecycle == "at-risk" or lifecycle == "struggling":
			at_risk_count += 1

		reports.append({
			"store_index": i,
			"name": str(store.get("name", "Store")),
			"state": lifecycle,
			"satisfaction": satisfaction,
			"weekly_sales": weekly_sales,
			"weekly_profit": tenant_profit,
			"base_rent": base_rent,
			"revenue_share_income": share_income,
			"statement": economy.last_statement,
			"risk_reasons": reasons
		})

	var maintenance := roundi(stores.size() * 50 + (100 - cleanliness) * 6 + (100 - security) * 5 + payroll)
	var amenity_income := amenity_count * 65
	var net_profit := total_rent + total_revenue_share + amenity_income - maintenance
	var avg_tenant_sat := roundi(float(total_tenant_satisfaction) / maxf(1.0, float(stores.size())))

	return {
		"total_rent": total_rent,
		"total_revenue_share": total_revenue_share,
		"amenity_income": amenity_income,
		"payroll": payroll,
		"maintenance": maintenance,
		"net_profit": net_profit,
		"reports": reports,
		"metrics": {
			"average_tenant_satisfaction": avg_tenant_sat,
			"at_risk_tenants": at_risk_count,
			"weekly_sales": _sum_reports(reports, "weekly_sales"),
			"weekly_store_profit": _sum_reports(reports, "weekly_profit")
		}
	}

func _score_tenant(store: Dictionary, economy: Dictionary, weekly_sales: int, weekly_served: int, cleanliness: int, security: int, reputation: int) -> int:
	var draw_expectation := maxi(1, int(store.get("draw", 35)) * 3)
	var sales_score := clampf(float(weekly_served) / float(draw_expectation), 0.0, 1.35) * 36.0
	var rent_pressure := float(economy.get("base_rent", 360)) / maxf(1.0, float(weekly_sales))
	var rent_score := clampf(1.0 - rent_pressure / maxf(0.1, float(economy.get("rent_tolerance", 0.38))), -0.4, 1.0) * 24.0
	var ops_score := (float(cleanliness) * 0.16) + (float(security) * 0.10) + (float(reputation) * 0.08)
	var layout_score := (float(store.get("layout_score", economy.get("layout_score", 50))) - 50.0) * 0.32
	var stock_penalty := 12.0 if float(store.get("stock", 100.0)) < 20.0 else 0.0
	var pricing_penalty := 8.0 if str(store.get("price", "Market")) == "Premium" and int(economy.get("prestige_tier", 1)) <= 1 else 0.0
	return clampi(roundi(28.0 + sales_score + rent_score + ops_score + layout_score - stock_penalty - pricing_penalty), 0, 100)

func _risk_reasons(store: Dictionary, economy: Dictionary, weekly_sales: int, weekly_served: int, cleanliness: int, security: int, satisfaction: int) -> Array[String]:
	var reasons: Array[String] = []
	if weekly_served < int(store.get("draw", 35)):
		reasons.append("low traffic")
	if float(economy.get("base_rent", 360)) / maxf(1.0, float(weekly_sales)) > float(economy.get("rent_tolerance", 0.38)):
		reasons.append("rent burden")
	if cleanliness < 65:
		reasons.append("cleanliness")
	if security < 60:
		reasons.append("security")
	if float(store.get("stock", 100.0)) < 20.0:
		reasons.append("low stock")
	for reason in store.get("layout_reasons", []):
		if str(reason) == "dead-zone risk" or str(reason) == "category saturation":
			reasons.append(str(reason))
	if satisfaction >= 82:
		reasons.append("strong operator")
	return reasons

func _lifecycle_for_score(score: int, weekly_sales: int, draw: int) -> String:
	if score >= 86 and weekly_sales > draw * 10:
		return "trending"
	if score >= 62:
		return "stable"
	if score >= 42:
		return "struggling"
	return "at-risk"

func _statement_for(store: Dictionary, weekly_sales: int, tenant_profit: int, satisfaction: int, lifecycle: String, reasons: Array[String]) -> String:
	var reason_text := ", ".join(reasons) if reasons.size() > 0 else "steady performance"
	return "%s is %s: sales $%s, tenant P/L %s$%s, satisfaction %d%% (%s)." % [
		str(store.get("name", "Store")),
		lifecycle,
		_comma(weekly_sales),
		"+" if tenant_profit >= 0 else "-",
		_comma(abs(tenant_profit)),
		satisfaction,
		reason_text
	]

func _profile_for_tenant(tenant_def: Dictionary, catalog_data: Dictionary) -> Dictionary:
	var profiles: Dictionary = catalog_data.get("economy_profiles", {})
	var category := str(tenant_def.get("category", "Fashion"))
	var profile: Dictionary = profiles.get(category, profiles.get("default", {})).duplicate(true)
	var override: Dictionary = tenant_def.get("economy", {})
	for key in override.keys():
		profile[key] = override[key]
	return profile

func _is_vacant(store: Dictionary) -> bool:
	return str(store.get("tenant_id", "")) == "vacant" or str(store.get("category", "")) == "Vacant"

func _find_tenant_by_id(tenant_id: String, catalog_data: Dictionary) -> Dictionary:
	for tenant in catalog_data.get("tenants", []):
		if str(tenant.get("id", "")) == tenant_id:
			return tenant
	return {}

func _lot_rent_multiplier(lot_type: String) -> float:
	match lot_type:
		"mega_anchor":
			return 2.1
		"flagship":
			return 1.45
		"boutique":
			return 0.78
		"kiosk":
			return 0.48
		_:
			return 1.0

func _sum_reports(reports: Array, key: String) -> int:
	var total := 0
	for report in reports:
		total += int(report.get(key, 0))
	return total

func _comma(value: int) -> String:
	var raw := str(value)
	var result := ""
	var count := 0
	for i in range(raw.length() - 1, -1, -1):
		result = raw[i] + result
		count += 1
		if count % 3 == 0 and i != 0:
			result = "," + result
	return result
