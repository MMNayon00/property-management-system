const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function refactorFile(filePath) {
  if (!filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Replace the managerId extraction with ownerId extraction
  const findManagerIdRegex = /const managerId = \(session as any\)\.user\.id as string;/g;
  const replacementText = `const managerId = (session as any).user.id as string;
    const managerUser = await prisma.user.findUnique({ where: { id: managerId } });
    const ownerId = managerUser?.ownerId;

    if (!ownerId) {
      return NextResponse.json({ error: "Manager not associated with any owner" }, { status: 403 });
    }`;
    
  content = content.replace(findManagerIdRegex, replacementText);

  // 2. Replace `{ managerId }` with `{ ownerId }` in prisma queries
  content = content.replace(/where:\s*{\s*managerId\s*}/g, 'where: { ownerId }');
  
  // 3. Replace `managerId: true` with `ownerId: true` in building select
  // Actually wait, building no longer has managerId! It only has ownerId!
  // In `select: { managerId: true }`, we don't need it or should replace with `ownerId: true`
  content = content.replace(/managerId:\s*true/g, 'ownerId: true');

  // 4. Replace `building.managerId !== managerId` with `building.ownerId !== ownerId`
  content = content.replace(/building\.managerId\s*!==\s*managerId/g, 'building.ownerId !== ownerId');
  
  // 5. Replace `createdById: managerId` with `createdById: managerId` (no change needed here, createdBy is User)

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

walkDir(path.join(__dirname, '../src/app/api/manager'), refactorFile);
walkDir(path.join(__dirname, '../src/app/api/buildings'), refactorFile);
walkDir(path.join(__dirname, '../src/app/api/available-flats'), refactorFile);
walkDir(path.join(__dirname, '../src/app/api/flats'), refactorFile);
walkDir(path.join(__dirname, '../src/app/api/tenants'), refactorFile);
walkDir(path.join(__dirname, '../src/app/api/owner/overview'), refactorFile);

console.log('Refactoring complete.');
