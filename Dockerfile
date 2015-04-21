FROM centos:centos6
MAINTAINER benb@softint.com.au

# Install apache
RUN yum -y update
RUN yum -y install httpd

# Configure apache
RUN sed -i 's/^#\?EnableMMAP\s.*$/EnableMMAP off/' /etc/httpd/conf/httpd.conf
RUN sed -i 's/^#\?EnableSendfile\s.*$/EnableSendfile off/' /etc/httpd/conf/httpd.conf

# Copy html
COPY . /var/www/html

# Run apache
EXPOSE 80
CMD ["/usr/sbin/httpd", "-D", "FOREGROUND"]
