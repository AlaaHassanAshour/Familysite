# ==========================================
# Stage 1: Build Angular Frontend
# ==========================================
FROM node:20-alpine AS client-build
WORKDIR /app/client

# نسخ ملفات الاعتمادات أولاً للاستفادة من الـ Cache
COPY client/package*.json ./
RUN npm ci

# نسخ باقي كود Angular وبنائه
COPY client/ ./
RUN npm run build -- --configuration production

# ==========================================
# Stage 2: Build ASP.NET Core Backend
# ==========================================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS dotnet-build
WORKDIR /app

# نسخ ملفات الـ csproj وإجراء restore للـ NuGet packages
COPY api/Ashour.Api.csproj ./api/
RUN dotnet restore api/Ashour.Api.csproj

# نسخ باقي كود الـ Backend
COPY api/ ./api/

# نسخ نواتج بناء Angular من الـ Stage الأولى إلى wwwroot داخل الـ API
COPY --from=client-build /app/client/dist/client/browser ./api/wwwroot

# نشر المشروع (Publish)
WORKDIR /app/api
RUN dotnet publish Ashour.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# ==========================================
# Stage 3: Runtime Environment
# ==========================================
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# ضبط متغيرات البيئة للـ Production والمنافذ
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# نسخ المخرجات النهائية فقط من مرحلة البناء
COPY --from=dotnet-build /app/publish .

ENTRYPOINT ["dotnet", "Ashour.Api.dll"]