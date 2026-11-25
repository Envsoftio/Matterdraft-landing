UPDATE `licence_plan`
SET `monthly_device_price` = 49900, `revision` = `revision` + 1
WHERE `id` = 'launch-solo' AND `account_type` = 'personal' AND `monthly_device_price` <> 49900;
