// Initialize mock user roles
(function initializeMockUsers() {
    // ALWAYS reinitialize to ensure correct roles
    const mockUsers = [
        // Administrator
        {
            username: 'admin',
            password: 'admin123',
            role: 'administrator',
            entity: 'All',
            fullName: 'Administrator',
            email: 'admin@ptpn3.co.id',
            createdAt: new Date().toISOString()
        },

        // PTPN III (Holding) - HC Divisions
        {
            username: 'hc_center',
            password: 'user123',
            role: 'user',
            entity: 'HC Center',
            fullName: 'HC Center User',
            email: 'hc.center@ptpn3.co.id',
            createdAt: new Date().toISOString()
        },
        {
            username: 'hc_bp',
            password: 'user123',
            role: 'user',
            entity: 'HC Business Partner',
            fullName: 'HC Business Partner User',
            email: 'hc.bp@ptpn3.co.id',
            createdAt: new Date().toISOString()
        },
        {
            username: 'talent_mgmt',
            password: 'user123',
            role: 'user',
            entity: 'Talent Management',
            fullName: 'Talent Management User',
            email: 'talent@ptpn3.co.id',
            createdAt: new Date().toISOString()
        },
        {
            username: 'org_dev',
            password: 'user123',
            role: 'user',
            entity: 'Organization Development',
            fullName: 'Organization Development User',
            email: 'orgdev@ptpn3.co.id',
            createdAt: new Date().toISOString()
        },

        // PTPN I
        {
            username: 'ptpn1',
            password: 'user123',
            role: 'user',
            entity: 'ptpn1',
            fullName: 'PTPN I User',
            email: 'user@ptpn1.co.id',
            createdAt: new Date().toISOString()
        },

        // PTPN III (Persero)
        {
            username: 'ptpn3',
            password: 'user123',
            role: 'user',
            entity: 'ptpn3',
            fullName: 'PTPN III User',
            email: 'user@ptpn3.co.id',
            createdAt: new Date().toISOString()
        },

        // PTPN IV
        {
            username: 'ptpn4',
            password: 'user123',
            role: 'user',
            entity: 'ptpn4',
            fullName: 'PTPN IV User',
            email: 'user@ptpn4.co.id',
            createdAt: new Date().toISOString()
        },

        // Sinergi Gula Nusantara
        {
            username: 'sgn',
            password: 'user123',
            role: 'user',
            entity: 'sgn',
            fullName: 'SGN User',
            email: 'user@sgn.co.id',
            createdAt: new Date().toISOString()
        },

        // LPP Agro Nusantara
        {
            username: 'lpp',
            password: 'user123',
            role: 'user',
            entity: 'lpp',
            fullName: 'LPP Agro User',
            email: 'user@lpp.co.id',
            createdAt: new Date().toISOString()
        },

        // Sri Pamela Medika
        {
            username: 'medika',
            password: 'user123',
            role: 'user',
            entity: 'medika',
            fullName: 'Medika User',
            email: 'user@medika.co.id',
            createdAt: new Date().toISOString()
        },

        // Riset Perkebunan Nusantara
        {
            username: 'rpn',
            password: 'user123',
            role: 'user',
            entity: 'rpn',
            fullName: 'RPN User',
            email: 'user@rpn.co.id',
            createdAt: new Date().toISOString()
        },

        // Kharisma Pemasaran Bersama Nusantara
        {
            username: 'kpbn',
            password: 'user123',
            role: 'user',
            entity: 'kpbn',
            fullName: 'KPBN User',
            email: 'user@kpbn.co.id',
            createdAt: new Date().toISOString()
        },

        // Bio Industri Nusantara
        {
            username: 'bio',
            password: 'user123',
            role: 'user',
            entity: 'bio',
            fullName: 'Bio Industri User',
            email: 'user@bio.co.id',
            createdAt: new Date().toISOString()
        },

        // Kawasan Industri Nusantara
        {
            username: 'kin',
            password: 'user123',
            role: 'user',
            entity: 'kin',
            fullName: 'KIN User',
            email: 'user@kin.co.id',
            createdAt: new Date().toISOString()
        },

        // Industri Karet Nusantara
        {
            username: 'ikn',
            password: 'user123',
            role: 'user',
            entity: 'ikn',
            fullName: 'IKN User',
            email: 'user@ikn.co.id',
            createdAt: new Date().toISOString()
        }
    ];

    localStorage.setItem('users', JSON.stringify(mockUsers));
    console.log('✅ Mock users initialized:', mockUsers.length, 'users');
    console.log('   - 1 Administrator (all entities)');
    console.log('   - 4 HC Division users');
    console.log('   - 11 Entity users (PTPN I, III, IV, SGN, LPP, Medika, RPN, KPBN, Bio, KIN, IKN)');
})();
