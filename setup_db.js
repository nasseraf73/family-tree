const postgres = require('postgres');

const connectionString = 'postgresql://postgres.deauywsosrpwdydfpgre:Nasser_af73@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres';

async function main() {
  console.log('Connecting to Supabase PostgreSQL (Al-Nammari)...');
  const sql = postgres(connectionString, { connect_timeout: 15 });

  try {
    const check = await sqlSELECT 1 as connected;
    console.log('Connected to Supabase successfully!');

    console.log('Creating tables...');
    
    // 1. Countries Table
    await sql
      CREATE TABLE IF NOT EXISTS countries (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(10),
        flag_emoji VARCHAR(10),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    ;

    // 2. Users Table
    await sql
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        role VARCHAR(20) NOT NULL DEFAULT 'USER',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    ;

    // 3. Persons Table
    await sql
      CREATE TABLE IF NOT EXISTS persons (
        id BIGSERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        father_name VARCHAR(100),
        grand_father_name VARCHAR(100),
        family_name VARCHAR(100),
        gender VARCHAR(10) NOT NULL,
        is_alive BOOLEAN NOT NULL DEFAULT true,
        birth_year INTEGER,
        death_date VARCHAR(20),
        burial_place VARCHAR(255),
        country_id BIGINT REFERENCES countries(id) ON DELETE SET NULL,
        photo_url TEXT,
        biography TEXT,
        is_placeholder BOOLEAN DEFAULT false,
        created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        claimed_by_user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
        claim_status VARCHAR(20) DEFAULT 'PENDING',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    ;

    // 4. Relationships Table
    await sql
      CREATE TABLE IF NOT EXISTS relationships (
        id BIGSERIAL PRIMARY KEY,
        person_id BIGINT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        related_person_id BIGINT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        relationship_type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        verified_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        verified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    ;

    // 5. Branch Reviewers Table
    await sql
      CREATE TABLE IF NOT EXISTS branch_reviewers (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        root_person_id BIGINT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ DEFAULT NOW()
      );
    ;

    // 6. Merge Requests Table
    await sql
      CREATE TABLE IF NOT EXISTS merge_requests (
        id BIGSERIAL PRIMARY KEY,
        primary_person_id BIGINT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        duplicate_person_id BIGINT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        requested_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        reviewed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    ;

    // 7. Marriages Table
    await sql
      CREATE TABLE IF NOT EXISTS marriages (
        id BIGSERIAL PRIMARY KEY,
        husband_id BIGINT NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
        wife_id BIGINT REFERENCES persons(id) ON DELETE CASCADE,
        external_spouse_name VARCHAR(255),
        external_family_name VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        marriage_order INTEGER NOT NULL DEFAULT 1,
        created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    ;

    // 8. Login Logs Table
    await sql
      CREATE TABLE IF NOT EXISTS login_logs (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        email VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        ip_address VARCHAR(100),
        user_agent TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    ;

    console.log('All tables created successfully!');

    console.log('Inserting initial data for Al-Nammari family...');
    
    // Seed Country
    await sql
      INSERT INTO countries (id, name, code, flag_emoji, is_active)
      VALUES (1, 'المملكة العربية السعودية', 'SA', '🇸🇦', true)
      ON CONFLICT (id) DO NOTHING;
    ;

    // Seed Admin User
    await sql
      INSERT INTO users (id, email, full_name, phone, role)
      VALUES (1, 'admin@nammari.family', 'مدير شجرة عائلة النمّاري', '+966500000000', 'ADMIN')
      ON CONFLICT (id) DO NOTHING;
    ;

    // Seed Persons (حزام, سعيدان, عبد الله, منيرة, حسنة, وطفة)
    await sql
      INSERT INTO persons (id, first_name, father_name, grand_father_name, family_name, gender, is_alive, country_id, biography, created_by_user_id)
      VALUES 
        (1, 'حزام', '', '', 'النمّاري', 'MALE', false, 1, 'الجد الأول ومؤسس فرع العائلة المبارك.', 1),
        (2, 'سعيدان', 'حزام', '', 'النمّاري', 'MALE', true, 1, 'ابن الجد حزام', 1),
        (3, 'عبد الله', 'حزام', '', 'النمّاري', 'MALE', true, 1, 'ابن الجد حزام', 1),
        (4, 'منيرة', 'حزام', '', 'النمّاري', 'FEMALE', true, 1, 'ابنة الجد حزام', 1),
        (5, 'حسنة', 'حزام', '', 'النمّاري', 'FEMALE', true, 1, 'ابنة الجد حزام', 1),
        (6, 'وطفة', 'حزام', '', 'النمّاري', 'FEMALE', true, 1, 'ابنة الجد حزام', 1)
      ON CONFLICT (id) DO NOTHING;
    ;

    // Seed Relationships (Parent-Child relations)
    await sql
      INSERT INTO relationships (id, person_id, related_person_id, relationship_type, status, created_by_user_id, verified_at)
      VALUES 
        (1, 2, 1, 'PARENT', 'VERIFIED', 1, NOW()),
        (2, 3, 1, 'PARENT', 'VERIFIED', 1, NOW()),
        (3, 4, 1, 'PARENT', 'VERIFIED', 1, NOW()),
        (4, 5, 1, 'PARENT', 'VERIFIED', 1, NOW()),
        (5, 6, 1, 'PARENT', 'VERIFIED', 1, NOW())
      ON CONFLICT (id) DO NOTHING;
    ;

    // Reset sequences
    await sqlSELECT setval('countries_id_seq', COALESCE((SELECT MAX(id) FROM countries), 1));
    await sqlSELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
    await sqlSELECT setval('persons_id_seq', COALESCE((SELECT MAX(id) FROM persons), 1));
    await sqlSELECT setval('relationships_id_seq', COALESCE((SELECT MAX(id) FROM relationships), 1));

    console.log('SUCCESS! Database schema created and Al-Nammari family tree initialized!');
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    await sql.end();
  }
}

main();