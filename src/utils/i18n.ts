import i18next from 'i18next';

i18next.init({
  lng: 'ru-Ru', // Default language
  resources: {
    'en-US': {
      translation: {
        request_status_update:
          "⚠Your request status is updated to 'NOT ACTIVE'. If admins didnt contact you, please repeat the request or contact  us through panel 'Contact Us'",
        request_saved: '✅Your request is saved!',
        btn_list_requests: '📭Requests',
        money_balance_positive_update:
          'Due to transaction deletion your money balance has been INCREASED by',
        money_balance_negative_update:
          'Due to transaction deletion your money balance has been DECREASED by',
        bonuses_balance_positive_update:
          'Due to transaction deletion your bonuses balance has been INCREASED by',
        bonuses_balance_negative_update:
          'Due to transaction deletion your bonuses balance has been DECREASED by',
        confirm_btn_purchase_request: '⚠Please, confirm if you want to leave the request.',
        yes_sure: '✅Yes, sure',
        enter_phone_number:
          "Please enter admin's phonenumber without spaces in the provided format (998 xx xxx xx xx): ",
        no_thanks: '❌No, thanks',
        admin_removed_notification:
          "⚠️You've been removed with admin's privileges. Please, restart bot with /start command",
        admin_granted_notification:
          "⚠️You've been provided with admin's privileges. Please, restart bot with /start command",
        sudo_granted_notification:
          "⚠️You've been provided with sudo privileges. Please, restart bot with /start command",
        sudo_removed_notification:
          "⚠️You've been REMOVED with sudo privileges. Please, restart bot with /start command",
        btn_purchase_request_cancelled: '❌Request cancelled',
        write_comment: 'Please leave a comment:',
        last_transactions: '💸Last Transactions',
        btn_rules: '⁉️Rules',
        btn_list_transactions: '💸List Transactions',
        coins: 'Coins',
        prev: '⬅️prev',
        next: 'next➡️',
        description: 'Description',
        invalid_phone_number:'❌Invalid Phone number provided',
        admin_removed_success: '✅Admin removed successfully!',
        bonuses_addition: 'Add',
        bonuses_removal: 'Remove',
        products_not_found: "No available products so far!",
        transaction_date: 'Transaction Date',
        products: 'Products',
        product: 'Product',
        user_not_found: 'User is not found. Please try to restart bot with /start command.',
        admin_not_found: 'Admin is not found. Ensure that correct phone number is provided and user is admin',
        provide_post_title: 'Post Title:',
        price: 'Price',
        provide_post_message: 'Post Message:',
        btn_confirm: '✅Confirm',
        post_sent: '✅Succesfully send',
        registration_on_start: 'Register ME',
        transactions: 'Transactions',
        btn_send_post: '✍️Send Post',
        btn_list_products: '🛒Products',
        no_transactions: "You currently have no transactions",
        balance_caption: 'Bonuses',
        money_caption: 'Money',
        btn_purchase_request: '💌Leave Request',
        choose_option: '🤖MannolUZBot Main Page',
        admin_added_success: '✅Admin added successfully!',
        choose_language:
          '🇺🇸Please choose your language.\n🇷🇺Пожалуйста, выберите свой язык.\n🇺🇿Iltimos, tilni tanlang.',
        share_contact: '📱Please share your contact.',
        btn_share_contact: '📱Share Contact',
        contact_saved: '✅Contact saved successfully.',
        btn_credit_card: '💳Get My Credit Card',
        btn_settings: '⚙️Settings',
        settings_menu_prompt: '⚙️Please choose settings to update',
        btn_change_language: '🌐Change System Language',
        btn_contact_us: '📞Contact Us',
        btn_add_admin: '➕Add Admin',
        btn_remove_admin: '➖Remove Admin',
        post_creation_cancelled: '❌Post NOT send.',
        btn_cancel_post_creation: '❌Cancel',
        language_changed: "✅Language's changed successfully.",
        active_request_exist:
          '❌You have active request! Please, wait until admins contact you. We apologize for delay and provided inconvenience.',
        contact_us_information: `📞Our contacts\n\nTashkent: 100002,\nphone: +998-99-011-98-94, +998-93-397-35-72.\n\nFergana Valley: 150100,\nphone: +998-94-718-54-45.\n\nSouthwest: 140100,\nphone: +998-94-718-54-45.\n\nMail: info@mannol.uz, Mannoloilsale@mail.ru.\n\nWebsite: mannol.uz.`,
        btn_go_back: '🔙Go Back',
        btn_about_us: '📃About Us',
        about_us_information: `📃Welcome to MANNOL’s official page!

As the authorized distributor for SCT-Vertriebs GmbH and MANNOL in Uzbekistan, we are based in Tashkent. Our mission is to provide high-quality vehicle products quickly and affordably to our partners and customers.

We offer an extensive range of over 800 types of lubricants and fluids under the MANNOL brand, known for its competitive pricing and comprehensive selection. As a leader in the automotive spare parts market, we prioritize meeting the needs and expectations of our clients.

We invite you to explore new opportunities with us and assure you that your proposals will receive careful consideration. Our goal is to support your success with efficient service and a wide product range.

Thank you for choosing MANNOL!`,
      },
    },
    'ru-RU': {
      translation: {
        request_status_update:
          "⚠Статус вашей последнее заявки обновлен на НЕАКТИВНЫЙ. Если с вами не связались пожалуйста оставьте заявку снова или свяжетесь с нами по предоставленным контактам через панель 'Связаться с нами'.",
        request_saved: '✅Ваша заявка сохранена!',
        btn_list_requests: '📭Список Заявок',
        btn_add_admin: '➕Добавить Админа',
        btn_remove_admin: '➖Удалить Админа',
        money_balance_positive_update:
          'Благодаря удалению транзакций ваш денежный баланс увеличился на',
        enter_phone_number:
          'Пожалуйста напишите номер админа без пробелов в предоставленом формате (998 xx xxx xx xx):',
        active_request_exist:
          '⚠У вас уже есть активная заявка! Пожалуйста, дождитесь пока администраторы свяжутся с вам. Просим извинение за вынужденное ожидание.',
        prev: '⬅️пред',
        next: 'след➡️',
        yes_sure: '✅Да, конечно',
        no_thanks: '❌Нет, спасибо',
        price: 'Цена',
        sudo_granted_notification:
          '⚠️Вам предаставили привилегии sudo админа. Пожалуйста перезапустите бота коммандой /start.',
        sudo_removed_nofitification:
          '⚠️У вас забрали привилегии sudo админа. Пожалуйста перезапустите бота коммандой /start.',
        admin_removed_notification:
          '⚠️У вас забрали привилегии админа. Пожалуйста перезапустите бота коммандой /start.',
        admin_granted_notification:
          '⚠️Вам предаставили привилегии админа. Пожалуйста перезапустите бота коммандой /start',
        btn_purchase_request_cancelled: '❌Отмена заявки',
        products_not_found: "Товары не найдены или не были добавлены.",
        confirm_btn_purchase_request: '⚠Пожалуйста подтвердите что хотите оставить заявку.',
        product: 'Товар',
        invalid_phone_number:'❌Формат телефона введен не верно',
        btn_list_transactions: '💸Список Транзакций',
        last_transactions: '💸Последнии транзакции',
        products: 'Товары',
        transactions: 'Транзакции',
        of: 'из',
        btn_rules: '⁉️Правила Использования бонусов',
        coins: 'Монет',
        write_comment: 'Пожалуйста, оставьте комментарий:',
        bonuses_addition: 'Начисление',
        btn_purchase_request: '💌Оставить заявку',
        description: 'Описание',
        transaction_date: 'Дата транзакции',
        bonuses_removal: 'Списание',
        no_transactions: "У вас нет транзакций.",
        provide_post_title: 'Заголовок Поста:',
        provide_post_message: 'Содержание Поста:',
        post_sent: '✅Пост отправлен!',
        btn_confirm: '✅Подтвердить',
        registration_on_start: 'Регистрация',
        btn_send_post: '✍️Отправить Пост',
        balance_caption: 'Бонусы',
        admin_added_success: '✅Админ добавлен успешно!',
        admin_removed_success: '✅Aдмин удален успешно!',
        user_not_found:"Пользователь не найден. Пожалуйста перезапустите бота коммандой /start",
        admin_not_found: "Admin Not Found. Ensure that phonenumber is correct and user is admin",
        money_caption: 'Деньги',
        choose_option: '🤖MannolUzBot Main Page',
        choose_language:
          '🇺🇸Please choose your language.\n🇷🇺Пожалуйста, выберите свой язык.\n🇺🇿Iltimos, tilni tanlang.',
        share_contact: '📱Пожалуйста, поделитесь своим контактом.',
        btn_share_contact: '📱Поделиться контактом',
        contact_saved: '✅Контакт успешно сохранен.',
        btn_credit_card: '💳Моя Кредитная карта',
        btn_settings: '⚙️Настройки',
        btn_list_products: '🛒Товары',
        settings_menu_prompt: '⚙️Выберите настройки которые хотите изменить',
        btn_go_back: '🔙Назад',
        btn_change_language: '🌐Изменить язык',
        btn_contact_us: '📞Связаться с нами',
        btn_about_us: '📃О нас',
        language_changed: '✅Язык изменен.',
        post_creation_cancelled: '❌Пост НЕ отправлен.',
        btn_cancel_post_creation: '❌Отмена',

        about_us_information: `📃Добро пожаловать на официальную страницу MANNOL!

Являясь официальным дистрибьютором SCT-Vertriebs GmbH и MANNOL в Узбекистане, мы находимся в Ташкенте. Наша миссия — быстро и по доступной цене предоставлять высококачественную автомобильную продукцию нашим партнерам и клиентам.

Мы предлагаем обширный ассортимент из более чем 800 видов смазочных материалов и жидкостей под брендом MANNOL, известным своими конкурентоспособными ценами и широким выбором. Являясь лидером на рынке автомобильных запчастей, мы уделяем приоритетное внимание удовлетворению потребностей и ожиданий наших клиентов.

Мы приглашаем вас изучить новые возможности вместе с нами и заверяем вас, что ваши предложения будут тщательно рассмотрены. Наша цель — поддержать ваш успех с помощью эффективного обслуживания и широкого ассортимента продукции.

Благодарим вас за выбор MANNOL!`,

        contact_us_information: `📞Наши Контакты\n\nТашкент: 100002,\nтел: +998-99-011-98-94, +998-93-397-35-72.\n\nФерганская долина: 150100,\nтел: +998-94-718-54-45.\n\nЮго-запад: 140100,\nтел: +998-94-718-54-45.\n\nПочта: info@mannol.uz, Mannoloilsale@mail.ru.\n\nСайт: mannol.uz .`,
      },
    },
    'uz-UZ': {
      translation: {
        request_status_update:
          "⚠Sizning so'rovingiz holati 'NOFAOL' holatiga o'zgartirildi. Agar administratorlar siz bilan bog'lanmagan bo'lsa, iltimos, so'rovni qaytadan yuboring yoki 'Biz bilan bog'lanish' paneli orqali bog'laning.",
        request_saved: "✅Sizning so'rovingiz saqlandi!",
        btn_list_requests: "📭So'rovlar",
        confirm_btn_purchase_request: "⚠️Iltimos, so'rov qoldirishni tasdiqlang.",
        yes_sure: '✅Ha, albatta',
        admin_not_found:"Admin Not Found. Ensure that phonenumber is correct and user is admin",
        user_not_found:"Foydalanuvchi topilmadi. Iltimos, /start buyrug'i bilan botni qayta ishga tushiring",
        no_thanks: "❌Yo'q, rahmat",
        admin_removed_notification:
          "⚠️Siz adminlik huquqlaridan mahrum qilindingiz. Iltimos, botni /start buyrug'i bilan qayta ishga tushiring.",
        admin_granted_notification:
          "⚠️Sizga adminlik huquqlari berildi. Iltimos, botni /start buyrug'i bilan qayta ishga tushiring.",
        btn_add_admin: "➕Adminni qo'shish",
        btn_remove_admin: '➖Adminni olib tashlash',
        btn_purchase_request_cancelled: "❌So'rov bekor qilindi",
        no_transactions: 'Sizda tranzaksiyalar yoq',
        products_not_found: "Mahsulotlar yoq",
        write_comment: 'Iltimos, izoh qoldiring:',
        last_transactions: '💸Oxirgi tranzaksiyalar',
        btn_rules: '⁉️Qoidalar',
        enter_phone_number:
          'Iltimos, adminning telefon raqamini taqdim etilgan formatda boʻsh joysiz kiriting (998 xx xxx xx xx):',
        invalid_phone_number: '❌Notogri telefon raqimi terilgan',
        admin_added_success: '✅Admin qoshildi!',
        admin_removed_success: '✅Administrator muvaffaqiyatli oʻchirildi',
        btn_list_transactions: '💸Tranzaksiyalar',
        coins: 'Tanga',
        prev: '⬅️Oldingi',
        next: 'Keyingi➡️',
        sudo_granted_nofitication:
          "⚠️Siz sudo adminlik huquqlaridan mahrum qilindingiz. Iltimos, botni /start buyrug'i bilan qayta ishga tushiring.",
        sudo_removed_nofitication:
          "⚠️Sizga sudo adminlik huquqlai berildi. Iltimos, botni /start buyrug'i bilan qayta ishga tushiring.",
        transactions: 'Tranzaksiyalar',
        products: 'Mahsulotlar',
        of: '/',
        description: 'Tavsif',
        bonuses_addition: "Qo'shish",
        bonuses_removal: 'Olib tashlash',
        product: 'Mahsulot',
        price: 'Narx',
        transaction_date: 'Tranzaksiya sanasi',
        provide_post_title: 'Post nomini kiriting:',
        provide_post_message: 'Post matnini kiriting:',
        btn_confirm: '✅Tasdiqlash',
        post_sent: '✅Muvaffaqiyatli yuborildi',
        registration_on_start: "Ro'yxatdan o'tish",
        btn_send_post: '✍️Post yuborish',
        btn_list_products: '🛒Mahsulotlar',
        balance_caption: 'Bonuslar',
        money_caption: 'Pul',
        btn_purchase_request: "💌So'rov qoldirish",
        choose_option: '🤖MannolUZBot Main Page',
        choose_language:
          '🇺🇸Please choose your language.\n🇷🇺Пожалуйста, выберите свой язык.\n🇺🇿Iltimos, tilni tanlang.',
        share_contact: '📱Iltimos, kontaktingizni ulashing.',
        btn_share_contact: '📱Kontakt ulashish',
        contact_saved: '✅Kontakt muvaffaqiyatli saqlandi.',
        btn_credit_card: '💳Mening kredit kartamni olish',
        btn_settings: '⚙️Sozlamalar',
        settings_menu_prompt: "⚙️Iltimos, yangilamoqchi bo'lgan sozlamalarni tanlang",
        btn_change_language: "🌐Tizim tilini o'zgartirish",
        btn_contact_us: "📞Biz bilan bog'laning",
        post_creation_cancelled: '❌Post yuborilmadi.',
        btn_cancel_post_creation: '❌Bekor qilish',
        language_changed: "✅Til muvaffaqiyatli o'zgartirildi.",
        active_request_exist:
          "❌Sizda faol so'rov mavjud! Iltimos, administratorlar siz bilan bog'lanishini kuting. Kechikish va noqulaylik uchun uzr so'raymiz.",
        contact_us_information:
          "📞Bizning kontaktlarimiz\n\nToshkent: 100002,\ntelefon: +998-99-011-98-94, +998-93-397-35-72.\n\nFarg'ona vodiysi: 150100,\ntelefon: +998-94-718-54-45.\n\nJanubi-g'arbiy: 140100,\ntelefon: +998-94-718-54-45.\n\nElektron pochta: info@mannol.uz, Mannoloilsale@mail.ru.\n\nVeb-sayt: mannol.uz.",
        btn_go_back: '🔙Orqaga qaytish',
        btn_about_us: '📃Biz haqimizda',
        about_us_information:
          "MANNOLning rasmiy sahifasiga xush kelibsiz!\n\nBiz SCT-Vertriebs GmbH va MANNOLning O'zbekistondagi vakolatli distribyutori bo'lib, Toshkentda joylashganmiz. Bizning maqsadimiz hamkorlarimiz va mijozlarimizga yuqori sifatli avtomobil mahsulotlarini tez va arzon narxlarda yetkazib berishdir.\n\nBiz MANNOL brendi ostida 800 dan ortiq turdagi moylar va suyuqliklarni taklif etamiz, ular o'zining raqobatbardosh narxlari va keng tanlovi bilan mashhur. Avtomobil ehtiyot qismlari bozorida yetakchi sifatida biz mijozlarimizning ehtiyojlari va kutilganlariga javob berishni ustuvor vazifa deb bilamiz.\n\nBiz sizni yangi imkoniyatlarni kashf qilishga taklif qilamiz va sizning takliflaringiz e'tibor bilan ko'rib chiqilishini ta'minlaymiz. Bizning maqsadimiz keng mahsulot tanlovi va samarali xizmat bilan sizning muvaffaqiyatingizni qo'llab-quvvatlashdir.\n\nMANNOLni tanlaganingiz uchun tashakkur!",
      },
    },
  },
});

export default i18next;
