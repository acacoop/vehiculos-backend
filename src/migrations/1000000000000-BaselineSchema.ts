import { MigrationInterface, QueryRunner } from "typeorm";

export class BaselineSchema1000000000000 implements MigrationInterface {
  name = "BaselineSchema1000000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Users
    await queryRunner.query(`
      CREATE TABLE [users] (
        [id] uniqueidentifier NOT NULL DEFAULT newsequentialid(),
        [first_name] nvarchar(100) NOT NULL,
        [last_name] nvarchar(100) NOT NULL,
        [cuit] nvarchar(14) NOT NULL,
        [email] nvarchar(255) NOT NULL,
        [active] bit NOT NULL DEFAULT ((1)),
        [entra_id] nvarchar(255) NOT NULL DEFAULT (''),
        CONSTRAINT [PK_a3ffb1c0c8416b9fc6f907b7433] PRIMARY KEY ([id])
      )
    `);
    await queryRunner.query(
      `CREATE INDEX [IDX_797d2e4daebc358d3223b75863] ON [users] ([cuit])`,
    );
    await queryRunner.query(
      `CREATE INDEX [IDX_97672ac88f789774dd47f7c8be] ON [users] ([email])`,
    );

    // 2. Vehicle Brands
    await queryRunner.query(`
      CREATE TABLE [vehicle_brands] (
        [id] uniqueidentifier NOT NULL DEFAULT newsequentialid(),
        [name] nvarchar(100) NOT NULL,
        CONSTRAINT [PK_3ede5be03b371734e1d8aa257c9] PRIMARY KEY ([id])
      )
    `);

    // 3. Maintenance Categories
    await queryRunner.query(`
      CREATE TABLE [maintenance_categories] (
        [id] uniqueidentifier NOT NULL DEFAULT newsequentialid(),
        [name] nvarchar(100) NOT NULL,
        CONSTRAINT [PK_ab736076431643cc769f720171a] PRIMARY KEY ([id])
      )
    `);

    // 4. Vehicle Models
    await queryRunner.query(`
      CREATE TABLE [vehicle_models] (
        [id] uniqueidentifier NOT NULL DEFAULT newsequentialid(),
        [name] nvarchar(100) NOT NULL,
        [vehicle_type] nvarchar(255) NULL,
        [brand_id] uniqueidentifier NULL,
        CONSTRAINT [PK_1c01752184334fdbcae9bbaa67f] PRIMARY KEY ([id]),
        CONSTRAINT [FK_e71c84a17f9c006260e2d487c01] FOREIGN KEY ([brand_id]) REFERENCES [vehicle_brands]([id]) ON DELETE CASCADE
      )
    `);

    // 5. Vehicles
    await queryRunner.query(`
      CREATE TABLE [vehicles] (
        [id] uniqueidentifier NOT NULL DEFAULT newsequentialid(),
        [license_plate] nvarchar(10) NOT NULL,
        [year] int NOT NULL,
        [chassis_number] nvarchar(50) NULL,
        [engine_number] nvarchar(50) NULL,
        [vehicle_type] varchar(50) NULL,
        [transmission] nvarchar(50) NULL,
        [fuel_type] nvarchar(50) NULL,
        [modelId] uniqueidentifier NULL,
        CONSTRAINT [PK_18d8646b59304dce4af3a9e35b6] PRIMARY KEY ([id]),
        CONSTRAINT [FK_5fe3e38b9bf4649e65fdfb04bdf] FOREIGN KEY ([modelId]) REFERENCES [vehicle_models]([id]) ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX [IDX_7e9fab2e8625b63613f67bd706] ON [vehicles] ([license_plate])`,
    );

    // 6. Maintenances
    await queryRunner.query(`
      CREATE TABLE [maintenances] (
        [id] uniqueidentifier NOT NULL DEFAULT newsequentialid(),
        [name] nvarchar(200) NOT NULL,
        [kilometers_frequency] int NULL,
        [days_frequency] int NULL,
        [observations] text NULL,
        [instructions] text NULL,
        [category_id] uniqueidentifier NULL,
        CONSTRAINT [PK_62403473bd524a42d58589aa78b] PRIMARY KEY ([id]),
        CONSTRAINT [FK_32e2a2a8ead2c52a60738f1bc68] FOREIGN KEY ([category_id]) REFERENCES [maintenance_categories]([id]) ON DELETE CASCADE
      )
    `);

    // 7. Assignments
    await queryRunner.query(`
      CREATE TABLE [assignments] (
        [id] uniqueidentifier NOT NULL DEFAULT newsequentialid(),
        [start_date] date NOT NULL DEFAULT (getdate()),
        [end_date] date NULL,
        [user_id] uniqueidentifier NULL,
        [vehicle_id] uniqueidentifier NULL,
        CONSTRAINT [PK_c54ca359535e0012b04dcbd80ee] PRIMARY KEY ([id]),
        CONSTRAINT [FK_068dea19275f7976a3e5cf2804b] FOREIGN KEY ([vehicle_id]) REFERENCES [vehicles]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_3e96b2dc80534b727b58b87b85f] FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE
      )
    `);

    // 8. Assigned Maintenances
    await queryRunner.query(`
      CREATE TABLE [assigned_maintenances] (
        [id] uniqueidentifier NOT NULL DEFAULT newsequentialid(),
        [kilometers_frequency] int NULL,
        [days_frequency] int NULL,
        [observations] text NULL,
        [instructions] text NULL,
        [vehicle_id] uniqueidentifier NULL,
        [maintenance_id] uniqueidentifier NULL,
        CONSTRAINT [PK_d189a1b550bed247f0fdd0159eb] PRIMARY KEY ([id]),
        CONSTRAINT [FK_7241f9b919f6ff9688930785335] FOREIGN KEY ([vehicle_id]) REFERENCES [vehicles]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_de57a116d3f8b7eaeb41a6def40] FOREIGN KEY ([maintenance_id]) REFERENCES [maintenances]([id]) ON DELETE CASCADE
      )
    `);

    // 9. Maintenance Records
    await queryRunner.query(`
      CREATE TABLE [maintenance_records] (
        [id] uniqueidentifier NOT NULL DEFAULT newsequentialid(),
        [date] date NOT NULL,
        [kilometers] int NOT NULL,
        [notes] text NULL,
        [user_id] uniqueidentifier NULL,
        [maintenance_id] uniqueidentifier NULL,
        [vehicle_id] uniqueidentifier NULL,
        CONSTRAINT [PK_287b838a22e8c8804262ccdb6a1] PRIMARY KEY ([id]),
        CONSTRAINT [FK_45205101794d4f28d3310012bb7] FOREIGN KEY ([user_id]) REFERENCES [users]([id]),
        CONSTRAINT [FK_790f0292ac82ad5e08dad5f4552] FOREIGN KEY ([vehicle_id]) REFERENCES [vehicles]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_f45a196602255f09cec8b251891] FOREIGN KEY ([maintenance_id]) REFERENCES [maintenances]([id]) ON DELETE CASCADE
      )
    `);

    // 10. Maintenances Requirements
    await queryRunner.query(`
      CREATE TABLE [maintenances_requirements] (
        [id] uniqueidentifier NOT NULL DEFAULT newsequentialid(),
        [kilometers_frequency] int NULL,
        [days_frequency] int NULL,
        [observations] text NULL,
        [instructions] text NULL,
        [start_date] date NOT NULL,
        [end_date] date NULL,
        [model_id] uniqueidentifier NULL,
        [maintenance_id] uniqueidentifier NULL,
        CONSTRAINT [PK_cec335e373c56b078e36c5e1c55] PRIMARY KEY ([id]),
        CONSTRAINT [FK_3af59d705182165be3c4f241ee4] FOREIGN KEY ([model_id]) REFERENCES [vehicle_models]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ee585cb4b4c053dc660e07549f5] FOREIGN KEY ([maintenance_id]) REFERENCES [maintenances]([id]) ON DELETE CASCADE
      )
    `);

    // 11. Reservations
    await queryRunner.query(`
      CREATE TABLE [reservations] (
        [id] uniqueidentifier NOT NULL DEFAULT newsequentialid(),
        [start_date] date NOT NULL,
        [end_date] date NOT NULL,
        [user_id] uniqueidentifier NULL,
        [vehicle_id] uniqueidentifier NULL,
        CONSTRAINT [PK_da95cef71b617ac35dc5bcda243] PRIMARY KEY ([id]),
        CONSTRAINT [FK_4af5055a871c46d011345a255a6] FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_f1815b51cc48775472c57b95109] FOREIGN KEY ([vehicle_id]) REFERENCES [vehicles]([id]) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX [IDX_c62a4f9425f4f612a5f49d7002] ON [reservations] ([start_date])`,
    );

    // 12. User Roles
    await queryRunner.query(`
      CREATE TABLE [user_roles] (
        [id] uniqueidentifier NOT NULL DEFAULT newsequentialid(),
        [role] varchar(20) NOT NULL DEFAULT ('user'),
        [start_time] datetime NOT NULL,
        [end_time] datetime NULL,
        [user_id] uniqueidentifier NULL,
        CONSTRAINT [PK_8acd5cf26ebd158416f477de799] PRIMARY KEY ([id]),
        CONSTRAINT [FK_87b8888186ca9769c960e926870] FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE
      )
    `);

    // 13. Vehicle ACL
    await queryRunner.query(`
      CREATE TABLE [vehicle_acl] (
        [id] uniqueidentifier NOT NULL DEFAULT newsequentialid(),
        [permission] varchar(20) NOT NULL DEFAULT ('Read'),
        [start_time] datetime NOT NULL,
        [end_time] datetime NULL,
        [user_id] uniqueidentifier NULL,
        [vehicle_id] uniqueidentifier NULL,
        CONSTRAINT [PK_c362c977b979f498a2b0ce6da5e] PRIMARY KEY ([id]),
        CONSTRAINT [FK_225267a29cd0791bba26b2d1bee] FOREIGN KEY ([user_id]) REFERENCES [users]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_cb30592470bdc407546b31274f8] FOREIGN KEY ([vehicle_id]) REFERENCES [vehicles]([id]) ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX [IDX_b2d65a8608934a8086d6eca957] ON [vehicle_acl] ([user_id], [vehicle_id])`,
    );

    // 14. Vehicle Kilometers
    await queryRunner.query(`
      CREATE TABLE [vehicle_kilometers] (
        [id] uniqueidentifier NOT NULL DEFAULT newsequentialid(),
        [date] datetime NOT NULL,
        [kilometers] int NOT NULL,
        [created_at] datetime NOT NULL DEFAULT (getdate()),
        [vehicle_id] uniqueidentifier NULL,
        [user_id] uniqueidentifier NULL,
        CONSTRAINT [PK_3faa5a356e7f0ccb59f9107ba3d] PRIMARY KEY ([id]),
        CONSTRAINT [FK_6fea2a435a1e7d5fe2ba65d11d0] FOREIGN KEY ([vehicle_id]) REFERENCES [vehicles]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_f1016e8147ba1ddc08be98dcbb7] FOREIGN KEY ([user_id]) REFERENCES [users]([id])
      )
    `);
    await queryRunner.query(
      `CREATE INDEX [IDX_6c9cfb9f12ee6838b4b3fec8a5] ON [vehicle_kilometers] ([vehicle_id], [date])`,
    );

    // 15. Vehicle Responsibles
    await queryRunner.query(`
      CREATE TABLE [vehicle_responsibles] (
        [id] uniqueidentifier NOT NULL DEFAULT newsequentialid(),
        [ceco] nvarchar(8) NOT NULL DEFAULT ('99999999'),
        [start_date] date NOT NULL DEFAULT (getdate()),
        [end_date] date NULL,
        [created_at] datetime NOT NULL DEFAULT (getdate()),
        [updated_at] datetime NOT NULL DEFAULT (getdate()),
        [vehicle_id] uniqueidentifier NULL,
        [user_id] uniqueidentifier NULL,
        CONSTRAINT [PK_3ec47de3bba078470bf04576ea7] PRIMARY KEY ([id]),
        CONSTRAINT [FK_766effdec29b8609b07f8fe52d6] FOREIGN KEY ([vehicle_id]) REFERENCES [vehicles]([id]) ON DELETE CASCADE,
        CONSTRAINT [FK_8a03075f1c3a479ba8064bf8bc9] FOREIGN KEY ([user_id]) REFERENCES [users]([id])
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE [vehicle_responsibles]`);
    await queryRunner.query(`DROP TABLE [vehicle_kilometers]`);
    await queryRunner.query(`DROP TABLE [vehicle_acl]`);
    await queryRunner.query(`DROP TABLE [user_roles]`);
    await queryRunner.query(`DROP TABLE [reservations]`);
    await queryRunner.query(`DROP TABLE [maintenances_requirements]`);
    await queryRunner.query(`DROP TABLE [maintenance_records]`);
    await queryRunner.query(`DROP TABLE [assigned_maintenances]`);
    await queryRunner.query(`DROP TABLE [assignments]`);
    await queryRunner.query(`DROP TABLE [maintenances]`);
    await queryRunner.query(`DROP TABLE [vehicles]`);
    await queryRunner.query(`DROP TABLE [vehicle_models]`);
    await queryRunner.query(`DROP TABLE [maintenance_categories]`);
    await queryRunner.query(`DROP TABLE [vehicle_brands]`);
    await queryRunner.query(`DROP TABLE [users]`);
  }
}
